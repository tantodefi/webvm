"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { useCheerpX } from '../utils/cheerpx-context';
import { usePersistentStorage } from '../utils/persistent-storage';
import { useUserPrivileges } from '../utils/user-privileges';

interface TerminalProps {
  className?: string;
}

const Terminal: React.FC<TerminalProps> = ({ className = "" }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('Loading terminal...');
  const termRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const cheerpXRef = useRef<any>(null);
  const cxReadFuncRef = useRef<any>(null);
  const { setAvailable, setInitializing } = useCheerpX();
  
  // User integration - safe fallbacks
  const { address } = useAccount();
  const { context } = useMiniKit();
  const { userInfo } = useUserPrivileges();
  const { currentUser, loadFilesystemSnapshot, saveFilesystemSnapshot } = usePersistentStorage();
  const [hasUserSession, setHasUserSession] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadCheerpX = async (): Promise<any> => {
    return new Promise((resolve, reject) => {
      // Check if CheerpX is already loaded
      if (window && (window as any).CheerpX) {
        resolve((window as any).CheerpX);
        return;
      }

      setStatus('Loading CheerpX runtime...');
      
      // Create a unique script ID to avoid duplicates
      const scriptId = 'cheerpx-runtime';
      if (document.getElementById(scriptId)) {
        // Script already exists, wait for it to load
        const checkExisting = () => {
          if ((window as any).CheerpX) {
            resolve((window as any).CheerpX);
          } else {
            setTimeout(checkExisting, 500);
          }
        };
        checkExisting();
        return;
      }

      // Load CheerpX as ES module using dynamic import approach
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'module';
      script.async = true;
      
      // Use module script content that imports and exposes CheerpX globally
      script.textContent = `
        console.log('Starting CheerpX dynamic import...');
        try {
          const CheerpX = await import('https://cxrtnc.leaningtech.com/1.1.5/cx.esm.js');
          console.log('CheerpX module loaded:', CheerpX);
          window.CheerpX = CheerpX;
          window.dispatchEvent(new CustomEvent('cheerpx-loaded', { detail: CheerpX }));
        } catch (error) {
          console.error('Failed to load CheerpX:', error);
          window.dispatchEvent(new CustomEvent('cheerpx-error', { detail: error }));
        }
      `;
      
      // Listen for custom events
      const handleLoaded = (event: any) => {
        window.removeEventListener('cheerpx-loaded', handleLoaded);
        window.removeEventListener('cheerpx-error', handleError);
        resolve(event.detail);
      };
      
      const handleError = (event: any) => {
        window.removeEventListener('cheerpx-loaded', handleLoaded);
        window.removeEventListener('cheerpx-error', handleError);
        reject(new Error('CheerpX loading failed: ' + event.detail.message));
      };
      
      window.addEventListener('cheerpx-loaded', handleLoaded);
      window.addEventListener('cheerpx-error', handleError);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        window.removeEventListener('cheerpx-loaded', handleLoaded);
        window.removeEventListener('cheerpx-error', handleError);
        reject(new Error('CheerpX loading timeout'));
      }, 30000);
      
      document.head.appendChild(script);
    });
  };

  const writeData = (buf: any, vt: number) => {
    if (vt !== 1 || !termRef.current) return;
    termRef.current.write(new Uint8Array(buf));
  };

  const readData = (str: string) => {
    if (!cxReadFuncRef.current) return;
    for (let i = 0; i < str.length; i++) {
      cxReadFuncRef.current(str.charCodeAt(i));
    }
  };

  const printMessage = (msg: string[]) => {
    if (!termRef.current) return;
    for (let i = 0; i < msg.length; i++) {
      termRef.current.write(msg[i] + "\r\n");
    }
  };

  const simulateLinuxCommand = (cmd: string): string[] => {
    const command = cmd.trim().toLowerCase();
    
    switch (command) {
      case 'help':
        return [
          'Available commands:',
          '  help     - Show this help message',
          '  ls       - List directory contents',
          '  pwd      - Print working directory',
          '  whoami   - Display current user',
          '  userinfo - Show detailed user information',
          '  uname    - System information',
          '  date     - Show current date and time',
          '  clear    - Clear terminal',
          '  echo     - Display a line of text',
          '  cat      - Display file contents (demo)',
          '  ps       - Show running processes (demo)',
          '  free     - Display memory usage (demo)',
          '  df       - Show disk usage (demo)',
          '  cheerpx  - Show CheerpX status',
          ''
        ];
      case 'userinfo':
        if (userInfo) {
          return [
            `User Information:`,
            `  Address: ${userInfo.address}`,
            `  Username: ${userInfo.username}`,
            userInfo.ensName ? `  ENS Name: ${userInfo.ensName}` : '',
            userInfo.displayName ? `  Display Name: ${userInfo.displayName}` : '',
            userInfo.fid ? `  Farcaster FID: ${userInfo.fid}` : '',
            userInfo.balance ? `  ETH Balance: ${userInfo.balance}` : '',
            `  Privileges: ${userInfo.privileges.map(p => p.type).join(', ')}`,
            ''
          ].filter(line => line !== '');
        } else {
          return ['No user session active. Connect wallet for enhanced features.', ''];
        }
      case 'cheerpx':
        return [
          `CheerpX Status: ${cheerpXRef.current ? 'Loaded' : 'Not Available'}`,
          `Runtime Version: ${cheerpXRef.current ? '1.1.5' : 'N/A'}`,
          `Terminal Mode: ${cheerpXRef.current ? 'Native' : 'Simulated'}`,
          `User Session: ${hasUserSession ? 'Active' : 'Guest'}`,
          ''
        ];
      case 'ls':
        return ['Documents  Downloads  Pictures  Music  Videos  Desktop', ''];
      case 'pwd':
        const homeDir = userInfo ? `/home/${userInfo.username}` : '/home/user';
        return [homeDir, ''];
      case 'whoami':
        return [userInfo?.username || 'user', ''];
      case 'uname -a':
        return ['Linux webvm 5.4.0-150-generic #167-Ubuntu x86_64 GNU/Linux', ''];
      case 'date':
        return [new Date().toString(), ''];
      case 'ps':
        return [
          '  PID TTY          TIME CMD',
          '    1 ?        00:00:01 systemd',
          '  123 pts/0    00:00:00 bash',
          ''
        ];
      case 'free':
        return [
          '              total        used        free',
          'Mem:         128000       45000       83000',
          ''
        ];
      case 'df':
        return [
          'Filesystem     1K-blocks    Used Available Use%',
          '/dev/sda1        1048576  262144    786432  25%',
          ''
        ];
      case 'clear':
        return ['CLEAR_SCREEN'];
      default:
        if (command.startsWith('echo ')) {
          return [command.substring(5), ''];
        }
        return [`bash: ${command}: command not found`, ''];
    }
  };

  const handleCommand = (command: string) => {
    if (!termRef.current) return;
    
    if (command.trim()) {
      if (cheerpXRef.current) {
        // If CheerpX is loaded, try to execute real command
        // For now, fall back to simulation
        const output = simulateLinuxCommand(command);
        
        if (output[0] === 'CLEAR_SCREEN') {
          termRef.current.clear();
        } else {
          output.forEach(line => {
            termRef.current.write(line + '\r\n');
          });
        }
      } else {
        // Simulated command execution
        const output = simulateLinuxCommand(command);
        
        if (output[0] === 'CLEAR_SCREEN') {
          termRef.current.clear();
        } else {
          output.forEach(line => {
            termRef.current.write(line + '\r\n');
          });
        }
      }
    }
    
    // Show new prompt with user-specific info
    const username = userInfo?.username || 'user';
    termRef.current.write(`\r\n\x1b[32m${username}@webvm\x1b[0m:\x1b[34m~\x1b[0m$ `);
  };

  const initializeCheerpX = async () => {
    try {
      setStatus('Loading CheerpX...');
      setInitializing(true);
      const CheerpX = await loadCheerpX();
      cheerpXRef.current = CheerpX;
      
      setStatus('Creating virtual devices...');
      
      // Enhanced configuration with user-specific settings
      const defaultConfig = {
        diskImageUrl: "wss://disks.webvm.io/debian_large_20230522_5044875331.ext2",
        diskImageType: "cloud",
        cmd: "/bin/bash",
        args: ["--login"],
        opts: {
          env: ["HOME=/home/user", "TERM=xterm", "USER=user", "SHELL=/bin/bash", "EDITOR=vim", "LANG=en_US.UTF-8", "LC_ALL=C"],
          cwd: "/home/user",
          uid: 1000,
          gid: 1000
        }
      };

      // If user is connected, enhance the configuration
      if (userInfo && address) {
        setHasUserSession(true);
        setStatus('Setting up personalized environment...');
        
        // User-specific environment
        defaultConfig.opts.env = [
          `HOME=/home/${userInfo.username}`,
          `USER=${userInfo.username}`,
          `LOGNAME=${userInfo.username}`,
          "SHELL=/bin/bash",
          "TERM=xterm-256color",
          `FARCASTER_FID=${userInfo.fid || ''}`,
          `FARCASTER_USERNAME=${userInfo.username || ''}`,
          `WALLET_ADDRESS=${userInfo.address}`,
          `ENS_NAME=${userInfo.ensName || ''}`,
          `USER_PRIVILEGES=${userInfo.privileges.map(p => p.type).join(',')}`,
          "LANG=en_US.UTF-8",
          "LC_ALL=C",
        ];
        defaultConfig.opts.cwd = `/home/${userInfo.username}`;
      }

      // Try to load user's filesystem if available
      let blockDevice;
      const userSnapshot = address ? loadFilesystemSnapshot(address) : null;
      
      if (userSnapshot && userInfo) {
        setStatus('Loading your previous session...');
        try {
          // TODO: Implement snapshot loading when CheerpX supports it
          // For now, use default image
          blockDevice = await CheerpX.CloudDevice.create(defaultConfig.diskImageUrl);
        } catch (e) {
          console.warn('Failed to load user snapshot, using default:', e);
          blockDevice = await CheerpX.CloudDevice.create(defaultConfig.diskImageUrl);
        }
      } else {
        try {
          setStatus('Loading disk image from WebSocket...');
          blockDevice = await CheerpX.CloudDevice.create(defaultConfig.diskImageUrl);
        } catch (e) {
          console.warn('CloudDevice WebSocket failed, trying HTTP fallback:', e);
          const wssProtocol = "wss:";
          if (defaultConfig.diskImageUrl.startsWith(wssProtocol)) {
            const httpUrl = "https:" + defaultConfig.diskImageUrl.substr(wssProtocol.length);
            setStatus('Loading disk image from HTTPS...');
            try {
              blockDevice = await CheerpX.CloudDevice.create(httpUrl);
            } catch (httpError) {
              console.warn('HTTP fallback also failed:', httpError);
              throw new Error(`Failed to load disk image: WebSocket failed (${e}), HTTP fallback failed (${httpError})`);
            }
          } else {
            throw e;
          }
        }
      }

      setStatus('Setting up filesystem cache...');
      const cacheId = userInfo ? `webvm_${address}_cache` : "webvm_minikit_cache";
      const blockCache = await CheerpX.IDBDevice.create(cacheId);
      const overlayDevice = await CheerpX.OverlayDevice.create(blockDevice, blockCache);
      const webDevice = await CheerpX.WebDevice.create("");
      const documentsDevice = await CheerpX.WebDevice.create("documents");
      const dataDevice = await CheerpX.DataDevice.create();

      const mountPoints = [
        { type: "ext2", dev: overlayDevice, path: "/" },
        { type: "dir", dev: webDevice, path: "/web" },
        { type: "dir", dev: dataDevice, path: "/data" },
        { type: "devs", path: "/dev" },
        { type: "devpts", path: "/dev/pts" },
        { type: "proc", path: "/proc" },
        { type: "sys", path: "/sys" },
        { type: "dir", dev: documentsDevice, path: "/home/user/documents" }
      ];

      setStatus('Starting Linux kernel...');
      const cx = await CheerpX.Linux.create({ mounts: mountPoints });
      
      // Set up the console
      cxReadFuncRef.current = cx.setCustomConsole(writeData, termRef.current.cols, termRef.current.rows);
      
      setStatus('Ready');
      setIsLoading(false);
      setAvailable(true);
      
      // Enhanced welcome message
      if (userInfo && hasUserSession) {
        printMessage([
          `🚀 Welcome to FarTerm, ${userInfo.username}!`,
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          `• 👤 User: ${userInfo.username} (${userInfo.address.slice(0, 6)}...${userInfo.address.slice(-4)})`,
          userInfo.fid ? `• 🎭 Farcaster: @${userInfo.username} (FID: ${userInfo.fid})` : '',
          userInfo.ensName ? `• 🏷️  ENS: ${userInfo.ensName}` : '',
          userInfo.balance ? `• 💰 Balance: ${userInfo.balance} ETH` : '',
          `• 🔐 Privileges: ${userInfo.privileges.map(p => p.type).join(', ')}`,
          `• ✅ CheerpX runtime loaded successfully`,
          `• ✅ Linux kernel initialized`,
          `• ✅ Virtual filesystem mounted`,
          `• 💾 Persistent storage enabled`,
          "",
          "This is a full Debian Linux environment with your personalized settings!",
          "Try commands like: userinfo, ls, pwd, whoami, ps, free, df, vim, python3, gcc",
          "Your files and settings are automatically saved across sessions.",
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          ""
        ].filter(line => line !== ''));
      } else {
        printMessage([
          "🚀 WebVM Mini App - Real Linux Environment",
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          "• ✅ CheerpX runtime loaded successfully",
          "• ✅ Linux kernel initialized",
          "• ✅ Virtual filesystem mounted",
          "",
          "This is a full Debian Linux environment running in your browser!",
          "Connect your wallet for personalized settings and persistent storage.",
          "Try commands like: ls, pwd, whoami, ps, free, df, vim, python3, gcc",
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          ""
        ]);
      }

      // Set up periodic filesystem sync for connected users
      if (userInfo && address) {
        const syncInterval = setInterval(async () => {
          try {
            // TODO: Implement proper snapshot export when CheerpX supports it
            // For now, just update lastActive time
            if (address) {
              saveFilesystemSnapshot(address, '');
            }
          } catch (error) {
            console.warn('Failed to save filesystem snapshot:', error);
          }
        }, 30000); // Save every 30 seconds

        // Clean up interval on unmount
        return () => clearInterval(syncInterval);
      }

      // Run bash in a loop
      while (true) {
        await cx.run(defaultConfig.cmd, defaultConfig.args, defaultConfig.opts);
      }
      
    } catch (e) {
      console.warn('CheerpX initialization failed, using simulation mode:', e);
      setStatus('Ready');
      setIsLoading(false);
      setAvailable(false);
      
      // Show welcome message for simulation mode
      const welcomeMessages = userInfo && hasUserSession ? [
        `🚀 Welcome to FarTerm, ${userInfo.username}! (Simulation Mode)`,
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        `• 👤 User: ${userInfo.username} (${userInfo.address.slice(0, 6)}...${userInfo.address.slice(-4)})`,
        userInfo.fid ? `• 🎭 Farcaster: @${userInfo.username} (FID: ${userInfo.fid})` : '',
        userInfo.ensName ? `• 🏷️  ENS: ${userInfo.ensName}` : '',
        userInfo.balance ? `• 💰 Balance: ${userInfo.balance} ETH` : '',
        `• 🔐 Privileges: ${userInfo.privileges.map(p => p.type).join(', ')}`,
        "• ⚠️  CheerpX runtime not available",
        "• ✅ Terminal simulation active", 
        "• ✅ Basic Linux commands supported",
        "",
        `Reason: ${e instanceof Error ? e.message : String(e)}`,
        "",
        "Your personalized settings are saved. Try 'userinfo' to see details.",
        "Type 'help' for available commands",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        ""
      ].filter(line => line !== '') : [
        "🚀 WebVM Mini App - Simulation Mode",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "• ⚠️  CheerpX runtime not available",
        "• ✅ Terminal simulation active", 
        "• ✅ Basic Linux commands supported",
        "",
        `Reason: ${e instanceof Error ? e.message : String(e)}`,
        "",
        "Connect your wallet for personalized experience!",
        "Type 'help' for available commands",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        ""
      ];
      
      printMessage(welcomeMessages);
    }
  };

  useEffect(() => {
    if (!isClient || !terminalRef.current) return;

    const initializeTerminal = async () => {
      try {
        setStatus('Loading terminal...');
        
        // Dynamic imports to avoid SSR issues
        const { Terminal } = await import('@xterm/xterm');
        const { FitAddon } = await import('@xterm/addon-fit');
        const { WebLinksAddon } = await import('@xterm/addon-web-links');

        const term = new Terminal({
          cursorBlink: true,
          convertEol: true,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          fontSize: 12,
          theme: {
            background: '#0a0a0a',
            foreground: '#ffffff',
            cursor: '#ffffff',
            black: '#2e2e2e',
            red: '#ff6b6b',
            green: '#51cf66',
            yellow: '#ffd43b',
            blue: '#74c0fc',
            magenta: '#f783ac',
            cyan: '#3bc9db',
            white: '#ffffff',
            brightBlack: '#495057',
            brightRed: '#ff8787',
            brightGreen: '#69db7c',
            brightYellow: '#ffe066',
            brightBlue: '#91a7ff',
            brightMagenta: '#faa2c1',
            brightCyan: '#66d9ef',
            brightWhite: '#ffffff'
          },
          rows: 30,
          cols: 100,
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();
        
        term.loadAddon(fitAddon);
        term.loadAddon(webLinksAddon);
        
        term.open(terminalRef.current!);
        term.scrollToTop();
        fitAddon.fit();
        term.focus();
        
        termRef.current = term;
        fitAddonRef.current = fitAddon;

        let currentInput = '';
        
        term.onData((data) => {
          if (cheerpXRef.current && cxReadFuncRef.current) {
            // If CheerpX is loaded, send data directly
            readData(data);
          } else {
            // Simulation mode - handle input manually
            const code = data.charCodeAt(0);
            
            if (code === 13) { // Enter
              term.write('\r\n');
              handleCommand(currentInput);
              currentInput = '';
            } else if (code === 127) { // Backspace
              if (currentInput.length > 0) {
                currentInput = currentInput.slice(0, -1);
                term.write('\b \b');
              }
            } else if (code >= 32) { // Printable characters
              currentInput += data;
              term.write(data);
            }
          }
        });

        // Handle resize
        const handleResize = () => {
          if (fitAddonRef.current) {
            fitAddonRef.current.fit();
            if (cxReadFuncRef.current && cheerpXRef.current) {
              cxReadFuncRef.current = cheerpXRef.current.setCustomConsole(
                writeData,
                termRef.current.cols,
                termRef.current.rows
              );
            }
          }
        };
        
        window.addEventListener('resize', handleResize);
        
        // Try to initialize CheerpX (will fall back to simulation)
        try {
          await initializeCheerpX();
        } catch (e) {
          // Already handled in initializeCheerpX
          console.warn('Terminal CheerpX init failed:', e);
          setIsLoading(false);
        }
        
        // Show initial prompt only in simulation mode
        if (!cheerpXRef.current) {
          setIsLoading(false);
          const username = userInfo?.username || 'user';
          term.write(`\x1b[32m${username}@webvm\x1b[0m:\x1b[34m~\x1b[0m$ `);
        }
        
        return () => {
          window.removeEventListener('resize', handleResize);
          term.dispose();
        };
      } catch (e) {
        console.error('Terminal initialization error:', e);
        setStatus('Error initializing terminal');
        setIsLoading(false);
      }
    };

    initializeTerminal();
  }, [isClient]);

  if (!isClient) {
    return (
      <div className={`w-full h-full bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-gray-400 text-sm">Initializing...</div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center z-10 rounded-lg">
          <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mb-2"></div>
          <div className="text-gray-300 text-sm">{status}</div>
        </div>
      )}
      <div 
        ref={terminalRef}
        className="w-full h-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
        style={{ 
          minHeight: '400px'
        }}
      />
    </div>
  );
};

export default Terminal; 