// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EVMAuthPurchasableERC1155.sol";

/**
 * @title WebVMSessionAuth
 * @dev Main contract for WebVM session management with EVMAuth integration
 * 
 * Inspired by EVMAuth (https://evmauth.io) - An open protocol for secure EVM-based authorization.
 * This implementation adapts the EVMAuth architecture for WebVM session management with 
 * custom features for multi-user collaborative environments.
 * 
 * EVMAuth Core: https://github.com/evmauth/evmauth-core
 */
contract WebVMSessionAuth is EVMAuthPurchasableERC1155 {
    struct SessionMetadata {
        string sessionName;
        string description;
        address creator;
        uint256 maxUsers;
        bool isPublic;
        string ipfsHash;
        uint256 createdAt;
        uint256 expiresAt;
        bool active;
    }

    struct UserSession {
        uint256 sessionId;
        address user;
        uint256 joinedAt;
        uint256 expiresAt;
        bool active;
        string role; // "owner", "admin", "user", "readonly"
    }

    // Session management
    mapping(uint256 => SessionMetadata) public sessions;
    mapping(uint256 => mapping(address => UserSession)) public userSessions;
    mapping(uint256 => address[]) public sessionUsers;
    mapping(address => uint256[]) public userSessionIds;
    
    // Session token types
    uint256 public constant SESSION_OWNER_TOKEN = 1;
    uint256 public constant SESSION_ADMIN_TOKEN = 2;
    uint256 public constant SESSION_USER_TOKEN = 3;
    uint256 public constant SESSION_READONLY_TOKEN = 4;

    // Events
    event SessionCreated(
        uint256 indexed sessionId,
        address indexed creator,
        string sessionName,
        bool isPublic,
        uint256 maxUsers
    );
    
    event UserJoinedSession(
        uint256 indexed sessionId,
        address indexed user,
        string role,
        uint256 expiresAt
    );
    
    event UserLeftSession(
        uint256 indexed sessionId,
        address indexed user
    );
    
    event SessionUpdated(
        uint256 indexed sessionId,
        string sessionName,
        string description,
        bool isPublic
    );

    constructor(
        string memory uri,
        address initialAdmin
    ) EVMAuthPurchasableERC1155(uri, initialAdmin) {
        // Initialize token metadata for session access tokens
        _initializeSessionTokens();
    }

    /**
     * @dev Initialize session token metadata
     */
    function _initializeSessionTokens() private {
        // Session Owner Token (full control)
        tokenMetadata[SESSION_OWNER_TOKEN] = TokenMetadata({
            active: true,
            burnable: true,
            transferable: false,
            price: 0.01 ether,
            ttl: 30 days
        });

        // Session Admin Token (manage users)
        tokenMetadata[SESSION_ADMIN_TOKEN] = TokenMetadata({
            active: true,
            burnable: true,
            transferable: false,
            price: 0.005 ether,
            ttl: 7 days
        });

        // Session User Token (read/write access)
        tokenMetadata[SESSION_USER_TOKEN] = TokenMetadata({
            active: true,
            burnable: true,
            transferable: false,
            price: 0.001 ether,
            ttl: 24 hours
        });

        // Session Readonly Token (read-only access)
        tokenMetadata[SESSION_READONLY_TOKEN] = TokenMetadata({
            active: true,
            burnable: true,
            transferable: false,
            price: 0.0001 ether,
            ttl: 1 hours
        });
    }

    /**
     * @dev Create a new WebVM session
     */
    function createSession(
        string memory sessionName,
        string memory description,
        uint256 maxUsers,
        bool isPublic,
        string memory ipfsHash,
        uint256 duration
    ) external payable notBlacklisted(msg.sender) returns (uint256) {
        require(bytes(sessionName).length > 0, "Session name required");
        require(maxUsers > 0 && maxUsers <= 100, "Invalid max users");
        require(duration > 0 && duration <= 365 days, "Invalid duration");

        uint256 sessionId = _getNewTokenId();
        uint256 expiresAt = block.timestamp + duration;

        // Create session metadata
        sessions[sessionId] = SessionMetadata({
            sessionName: sessionName,
            description: description,
            creator: msg.sender,
            maxUsers: maxUsers,
            isPublic: isPublic,
            ipfsHash: ipfsHash,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            active: true
        });

        // Mint owner token to creator
        _mint(msg.sender, SESSION_OWNER_TOKEN, 1, "");
        
        // Add creator as session owner
        _addUserToSession(sessionId, msg.sender, "owner", expiresAt);

        emit SessionCreated(sessionId, msg.sender, sessionName, isPublic, maxUsers);
        return sessionId;
    }

    /**
     * @dev Join a session by purchasing access token
     */
    function joinSession(uint256 sessionId, uint256 tokenType) 
        external 
        payable 
        notBlacklisted(msg.sender) 
    {
        SessionMetadata storage session = sessions[sessionId];
        require(session.active, "Session not active");
        require(block.timestamp < session.expiresAt, "Session expired");
        require(sessionUsers[sessionId].length < session.maxUsers, "Session full");
        require(!userSessions[sessionId][msg.sender].active, "Already in session");
        
        // Validate token type
        require(
            tokenType == SESSION_ADMIN_TOKEN || 
            tokenType == SESSION_USER_TOKEN || 
            tokenType == SESSION_READONLY_TOKEN,
            "Invalid token type"
        );

        // Purchase the access token
        TokenMetadata memory metadata = tokenMetadata[tokenType];
        require(msg.value >= metadata.price, "Insufficient payment");

        // Mint the access token
        _mint(msg.sender, tokenType, 1, "");

        // Handle payment
        _totalFunds += metadata.price;
        _walletBalances[address(this)] += metadata.price;
        
        if (msg.value > metadata.price) {
            payable(msg.sender).transfer(msg.value - metadata.price);
        }

        // Determine role and expiration
        string memory role = _getTokenRole(tokenType);
        uint256 expiresAt = block.timestamp + metadata.ttl;

        // Add user to session
        _addUserToSession(sessionId, msg.sender, role, expiresAt);

        emit UserJoinedSession(sessionId, msg.sender, role, expiresAt);
    }

    /**
     * @dev Leave a session
     */
    function leaveSession(uint256 sessionId) external {
        require(userSessions[sessionId][msg.sender].active, "Not in session");
        
        _removeUserFromSession(sessionId, msg.sender);
        emit UserLeftSession(sessionId, msg.sender);
    }

    /**
     * @dev Update session metadata (owner only)
     */
    function updateSession(
        uint256 sessionId,
        string memory sessionName,
        string memory description,
        bool isPublic
    ) external {
        require(sessions[sessionId].creator == msg.sender, "Not session owner");
        require(sessions[sessionId].active, "Session not active");

        sessions[sessionId].sessionName = sessionName;
        sessions[sessionId].description = description;
        sessions[sessionId].isPublic = isPublic;

        emit SessionUpdated(sessionId, sessionName, description, isPublic);
    }

    /**
     * @dev Extend session duration (owner only)
     */
    function extendSession(uint256 sessionId, uint256 additionalTime) 
        external 
        payable 
    {
        require(sessions[sessionId].creator == msg.sender, "Not session owner");
        require(sessions[sessionId].active, "Session not active");
        require(additionalTime > 0, "Invalid additional time");

        sessions[sessionId].expiresAt += additionalTime;
    }

    /**
     * @dev Get session information
     */
    function getSession(uint256 sessionId) 
        external 
        view 
        returns (SessionMetadata memory) 
    {
        return sessions[sessionId];
    }

    /**
     * @dev Get user's session info
     */
    function getUserSession(uint256 sessionId, address user) 
        external 
        view 
        returns (UserSession memory) 
    {
        return userSessions[sessionId][user];
    }

    /**
     * @dev Get all users in a session
     */
    function getSessionUsers(uint256 sessionId) 
        external 
        view 
        returns (address[] memory) 
    {
        return sessionUsers[sessionId];
    }

    /**
     * @dev Get user's active sessions
     */
    function getUserSessions(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userSessionIds[user];
    }

    /**
     * @dev Check if user has access to session
     */
    function hasSessionAccess(uint256 sessionId, address user) 
        external 
        view 
        returns (bool) 
    {
        UserSession memory userSession = userSessions[sessionId][user];
        return userSession.active && block.timestamp < userSession.expiresAt;
    }

    /**
     * @dev Get user's role in session
     */
    function getUserRole(uint256 sessionId, address user) 
        external 
        view 
        returns (string memory) 
    {
        return userSessions[sessionId][user].role;
    }

    /**
     * @dev Internal function to add user to session
     */
    function _addUserToSession(
        uint256 sessionId,
        address user,
        string memory role,
        uint256 expiresAt
    ) private {
        userSessions[sessionId][user] = UserSession({
            sessionId: sessionId,
            user: user,
            joinedAt: block.timestamp,
            expiresAt: expiresAt,
            active: true,
            role: role
        });

        sessionUsers[sessionId].push(user);
        userSessionIds[user].push(sessionId);
    }

    /**
     * @dev Internal function to remove user from session
     */
    function _removeUserFromSession(uint256 sessionId, address user) private {
        userSessions[sessionId][user].active = false;

        // Remove from sessionUsers array
        address[] storage users = sessionUsers[sessionId];
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] == user) {
                users[i] = users[users.length - 1];
                users.pop();
                break;
            }
        }

        // Remove from userSessionIds array
        uint256[] storage sessionIds = userSessionIds[user];
        for (uint256 i = 0; i < sessionIds.length; i++) {
            if (sessionIds[i] == sessionId) {
                sessionIds[i] = sessionIds[sessionIds.length - 1];
                sessionIds.pop();
                break;
            }
        }
    }

    /**
     * @dev Get role string from token type
     */
    function _getTokenRole(uint256 tokenType) private pure returns (string memory) {
        if (tokenType == SESSION_OWNER_TOKEN) return "owner";
        if (tokenType == SESSION_ADMIN_TOKEN) return "admin";
        if (tokenType == SESSION_USER_TOKEN) return "user";
        if (tokenType == SESSION_READONLY_TOKEN) return "readonly";
        return "unknown";
    }

    /**
     * @dev Clean up expired sessions (anyone can call)
     */
    function cleanupExpiredSessions(uint256[] calldata sessionIds) external {
        for (uint256 i = 0; i < sessionIds.length; i++) {
            uint256 sessionId = sessionIds[i];
            if (sessions[sessionId].active && block.timestamp >= sessions[sessionId].expiresAt) {
                sessions[sessionId].active = false;
                
                // Remove all users from expired session
                address[] memory users = sessionUsers[sessionId];
                for (uint256 j = 0; j < users.length; j++) {
                    _removeUserFromSession(sessionId, users[j]);
                }
            }
        }
    }
} 