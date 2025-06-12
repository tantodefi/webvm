// Real-time User Tracking for WebVM Sessions
// This module provides WebSocket-based real-time tracking of users in sessions

const WebSocket = require('ws');
const EventEmitter = require('events');

/**
 * Real-time session tracker
 */
class SessionTracker extends EventEmitter {
  constructor(options = {}) {
    super();
    this.sessions = new Map(); // sessionId -> SessionState
    this.users = new Map(); // userAddress -> UserState
    this.connections = new Map(); // connectionId -> WebSocket
    this.options = {
      heartbeatInterval: 30000, // 30 seconds
      sessionTimeout: 300000, // 5 minutes
      maxUsersPerSession: 100,
      ...options
    };
    
    this.startHeartbeat();
  }

  /**
   * Session state management
   */
  createSession(sessionId, metadata) {
    const session = {
      id: sessionId,
      metadata: metadata,
      users: new Set(),
      createdAt: Date.now(),
      lastActivity: Date.now(),
      active: true,
      events: []
    };

    this.sessions.set(sessionId, session);
    this.emit('sessionCreated', { sessionId, session });
    
    console.log(`📦 Session ${sessionId} created: ${metadata.sessionName}`);
    return session;
  }

  /**
   * User joins a session
   */
  joinSession(sessionId, userAddress, role, connectionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.users.size >= this.options.maxUsersPerSession) {
      throw new Error(`Session ${sessionId} is full`);
    }

    // Create or update user state
    const user = {
      address: userAddress,
      role: role,
      sessionId: sessionId,
      connectionId: connectionId,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      active: true,
      cursor: { x: 0, y: 0 },
      currentDirectory: '/home/user',
      terminalState: {
        command: '',
        output: []
      }
    };

    session.users.add(userAddress);
    session.lastActivity = Date.now();
    this.users.set(userAddress, user);

    // Add event to session
    const event = {
      type: 'user_joined',
      user: userAddress,
      role: role,
      timestamp: Date.now()
    };
    session.events.push(event);

    this.emit('userJoined', { sessionId, userAddress, role });
    this.broadcastToSession(sessionId, {
      type: 'user_joined',
      data: { user: userAddress, role: role }
    });

    console.log(`👤 User ${userAddress} joined session ${sessionId} as ${role}`);
    return user;
  }

  /**
   * User leaves a session
   */
  leaveSession(sessionId, userAddress) {
    const session = this.sessions.get(sessionId);
    const user = this.users.get(userAddress);

    if (session && user) {
      session.users.delete(userAddress);
      session.lastActivity = Date.now();
      user.active = false;

      // Add event to session
      const event = {
        type: 'user_left',
        user: userAddress,
        timestamp: Date.now()
      };
      session.events.push(event);

      this.emit('userLeft', { sessionId, userAddress });
      this.broadcastToSession(sessionId, {
        type: 'user_left',
        data: { user: userAddress }
      });

      console.log(`👋 User ${userAddress} left session ${sessionId}`);
    }
  }

  /**
   * Update user activity
   */
  updateUserActivity(userAddress, activity) {
    const user = this.users.get(userAddress);
    if (!user) return;

    user.lastSeen = Date.now();
    
    // Update specific activity data
    if (activity.cursor) {
      user.cursor = activity.cursor;
    }
    
    if (activity.currentDirectory) {
      user.currentDirectory = activity.currentDirectory;
    }
    
    if (activity.terminalState) {
      user.terminalState = { ...user.terminalState, ...activity.terminalState };
    }

    // Update session activity
    const session = this.sessions.get(user.sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }

    // Broadcast activity to other users in session
    this.broadcastToSession(user.sessionId, {
      type: 'user_activity',
      data: {
        user: userAddress,
        activity: activity,
        timestamp: Date.now()
      }
    }, userAddress); // Exclude the user who sent the activity
  }

  /**
   * Handle terminal command execution
   */
  executeCommand(userAddress, command, output) {
    const user = this.users.get(userAddress);
    if (!user) return;

    const commandEvent = {
      type: 'command_executed',
      user: userAddress,
      command: command,
      output: output,
      timestamp: Date.now(),
      directory: user.currentDirectory
    };

    // Add to session events
    const session = this.sessions.get(user.sessionId);
    if (session) {
      session.events.push(commandEvent);
      session.lastActivity = Date.now();
    }

    // Update user terminal state
    user.terminalState.command = command;
    user.terminalState.output.push({
      command: command,
      output: output,
      timestamp: Date.now()
    });

    // Keep only last 100 commands
    if (user.terminalState.output.length > 100) {
      user.terminalState.output = user.terminalState.output.slice(-100);
    }

    // Broadcast to session
    this.broadcastToSession(user.sessionId, {
      type: 'command_executed',
      data: commandEvent
    });

    this.emit('commandExecuted', commandEvent);
  }

  /**
   * Broadcast message to all users in a session
   */
  broadcastToSession(sessionId, message, excludeUser = null) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    for (const userAddress of session.users) {
      if (excludeUser && userAddress === excludeUser) continue;
      
      const user = this.users.get(userAddress);
      if (user && user.connectionId) {
        const connection = this.connections.get(user.connectionId);
        if (connection && connection.readyState === WebSocket.OPEN) {
          connection.send(JSON.stringify(message));
        }
      }
    }
  }

  /**
   * Get session state
   */
  getSessionState(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const users = Array.from(session.users).map(userAddress => {
      const user = this.users.get(userAddress);
      return {
        address: userAddress,
        role: user?.role,
        joinedAt: user?.joinedAt,
        lastSeen: user?.lastSeen,
        active: user?.active,
        cursor: user?.cursor,
        currentDirectory: user?.currentDirectory
      };
    });

    return {
      ...session,
      users: users,
      userCount: users.length
    };
  }

  /**
   * Start heartbeat to check for inactive users
   */
  startHeartbeat() {
    setInterval(() => {
      const now = Date.now();
      
      // Check for inactive users
      for (const [userAddress, user] of this.users.entries()) {
        if (user.active && (now - user.lastSeen) > this.options.sessionTimeout) {
          console.log(`⏰ User ${userAddress} timed out`);
          this.leaveSession(user.sessionId, userAddress);
        }
      }

      // Check for empty sessions
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.active && session.users.size === 0 && 
            (now - session.lastActivity) > this.options.sessionTimeout) {
          console.log(`🗑️  Session ${sessionId} expired (no users)`);
          session.active = false;
          this.emit('sessionExpired', { sessionId });
        }
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Register WebSocket connection
   */
  registerConnection(connectionId, ws) {
    this.connections.set(connectionId, ws);
    
    ws.on('close', () => {
      this.connections.delete(connectionId);
      
      // Find user with this connection and mark as inactive
      for (const [userAddress, user] of this.users.entries()) {
        if (user.connectionId === connectionId) {
          this.leaveSession(user.sessionId, userAddress);
          break;
        }
      }
    });
  }

  /**
   * Get statistics
   */
  getStats() {
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.active).length;
    const activeUsers = Array.from(this.users.values()).filter(u => u.active).length;
    const totalConnections = this.connections.size;

    return {
      activeSessions,
      activeUsers,
      totalConnections,
      totalSessions: this.sessions.size,
      totalUsers: this.users.size
    };
  }
}

/**
 * WebSocket server for real-time communication
 */
class RealtimeServer {
  constructor(port = 8080, options = {}) {
    this.port = port;
    this.tracker = new SessionTracker(options);
    this.wss = null;
    
    this.setupEventHandlers();
  }

  start() {
    this.wss = new WebSocket.Server({ port: this.port });
    
    this.wss.on('connection', (ws, req) => {
      const connectionId = this.generateConnectionId();
      this.tracker.registerConnection(connectionId, ws);
      
      console.log(`🔌 New connection: ${connectionId}`);
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(connectionId, message, ws);
        } catch (error) {
          console.error('Invalid message format:', error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        console.log(`🔌 Connection closed: ${connectionId}`);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        connectionId: connectionId,
        timestamp: Date.now()
      }));
    });

    console.log(`🚀 Realtime server started on port ${this.port}`);
  }

  handleMessage(connectionId, message, ws) {
    const { type, data } = message;

    try {
      switch (type) {
        case 'join_session':
          this.tracker.joinSession(
            data.sessionId,
            data.userAddress,
            data.role,
            connectionId
          );
          ws.send(JSON.stringify({
            type: 'joined_session',
            sessionId: data.sessionId,
            timestamp: Date.now()
          }));
          break;

        case 'leave_session':
          this.tracker.leaveSession(data.sessionId, data.userAddress);
          break;

        case 'user_activity':
          this.tracker.updateUserActivity(data.userAddress, data.activity);
          break;

        case 'execute_command':
          this.tracker.executeCommand(
            data.userAddress,
            data.command,
            data.output
          );
          break;

        case 'get_session_state':
          const state = this.tracker.getSessionState(data.sessionId);
          ws.send(JSON.stringify({
            type: 'session_state',
            data: state,
            timestamp: Date.now()
          }));
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;

        default:
          ws.send(JSON.stringify({ error: `Unknown message type: ${type}` }));
      }
    } catch (error) {
      console.error(`Error handling message type ${type}:`, error);
      ws.send(JSON.stringify({ error: error.message }));
    }
  }

  setupEventHandlers() {
    this.tracker.on('sessionCreated', (data) => {
      console.log(`📦 Session created: ${data.sessionId}`);
    });

    this.tracker.on('userJoined', (data) => {
      console.log(`👤 User joined: ${data.userAddress} -> Session ${data.sessionId}`);
    });

    this.tracker.on('userLeft', (data) => {
      console.log(`👋 User left: ${data.userAddress} <- Session ${data.sessionId}`);
    });

    this.tracker.on('commandExecuted', (data) => {
      console.log(`💻 Command: ${data.user} executed "${data.command}"`);
    });
  }

  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      console.log('🛑 Realtime server stopped');
    }
  }

  getStats() {
    return this.tracker.getStats();
  }
}

/**
 * Frontend client example
 */
const clientExample = `
// Frontend WebSocket client for real-time session tracking
class WebVMRealtimeClient {
  constructor(wsUrl = 'ws://localhost:8080') {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.connectionId = null;
    this.callbacks = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.onopen = () => {
        console.log('🔌 Connected to realtime server');
        resolve();
      };
      
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };
      
      this.ws.onclose = () => {
        console.log('🔌 Disconnected from realtime server');
        // Implement reconnection logic here
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
    });
  }

  joinSession(sessionId, userAddress, role) {
    this.send({
      type: 'join_session',
      data: { sessionId, userAddress, role }
    });
  }

  updateActivity(userAddress, activity) {
    this.send({
      type: 'user_activity',
      data: { userAddress, activity }
    });
  }

  executeCommand(userAddress, command, output) {
    this.send({
      type: 'execute_command',
      data: { userAddress, command, output }
    });
  }

  onUserJoined(callback) {
    this.callbacks.set('user_joined', callback);
  }

  onCommandExecuted(callback) {
    this.callbacks.set('command_executed', callback);
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  handleMessage(message) {
    const callback = this.callbacks.get(message.type);
    if (callback) {
      callback(message.data);
    }
  }
}

// Usage example:
const client = new WebVMRealtimeClient();
await client.connect();

client.onUserJoined((data) => {
  console.log('User joined:', data);
  // Update UI to show new user
});

client.onCommandExecuted((data) => {
  console.log('Command executed:', data);
  // Update terminal display
});

client.joinSession(1, '0x123...', 'user');
`;

module.exports = {
  SessionTracker,
  RealtimeServer,
  clientExample
};

// If run directly, start the server
if (require.main === module) {
  const server = new RealtimeServer(8080);
  server.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\\n🛑 Shutting down realtime server...');
    server.stop();
    process.exit(0);
  });
} 