import { create } from 'zustand';
import { config } from './config';

type ConnectionState = 'DISCONNECTED' | 'DOWNLOADING' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

interface NetworkState {
  connectionState: ConnectionState;
  currentIp: string | null;
  loginUrl: string | null;
  dashboardUrl: string | null;
  setConnectionState: (state: ConnectionState) => void;
  setCurrentIp: (ip: string | null) => void;
  setLoginUrl: (url: string | null) => void;
  setDashboardUrl: (url: string | null) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  connectionState: 'DISCONNECTED',
  currentIp: null,
  loginUrl: null,
  dashboardUrl: null,
  setConnectionState: (state) => set({ connectionState: state }),
  setCurrentIp: (ip) => set({ currentIp: ip }),
  setLoginUrl: (url) => set({ loginUrl: url }),
  setDashboardUrl: (url) => set({ dashboardUrl: url }),
}));

export const createNetworkInterface = async () => {
  const store = useNetworkStore.getState();
  store.setConnectionState('DOWNLOADING');

  try {
    // Load Tailscale script
    const script = document.createElement('script');
    script.src = config.TAILSCALE_URL;
    script.async = true;
    document.body.appendChild(script);

    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
    });

    store.setConnectionState('CONNECTING');

    // Initialize Tailscale
    const tailscale = (window as any).Tailscale;
    if (!tailscale) {
      throw new Error('Tailscale not loaded');
    }

    const { ip, loginUrl, dashboardUrl } = await tailscale.up({
      authKey: config.TAILSCALE_AUTHKEY,
      hostname: `farterm-${Math.random().toString(36).substring(7)}`,
    });

    store.setCurrentIp(ip);
    store.setLoginUrl(loginUrl);
    store.setDashboardUrl(dashboardUrl);
    store.setConnectionState('CONNECTED');

    return { ip, loginUrl, dashboardUrl };
  } catch (error) {
    console.error('Failed to create network interface:', error);
    store.setConnectionState('ERROR');
    throw error;
  }
};

export const handleCopyIP = (store: NetworkState, e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  if (store.currentIp) {
    navigator.clipboard.writeText(store.currentIp);
  }
};

export const getNetworkButtonData = (
  connectionState: ConnectionState,
  currentIp: string | null,
  loginUrl: string | null,
  dashboardUrl: string | null,
  onConnect: () => void
) => {
  switch (connectionState) {
    case 'DISCONNECTED':
      return {
        buttonText: 'Connect to Network',
        isClickable: true,
        clickHandler: onConnect,
      };
    case 'DOWNLOADING':
      return {
        buttonText: 'Downloading Tailscale...',
        isClickable: false,
      };
    case 'CONNECTING':
      return {
        buttonText: 'Connecting...',
        isClickable: false,
      };
    case 'CONNECTED':
      return {
        buttonText: `Connected: ${currentIp}`,
        buttonTooltip: 'Right-click to copy IP',
        isClickable: true,
        clickUrl: dashboardUrl,
      };
    case 'ERROR':
      return {
        buttonText: 'Connection Error',
        isClickable: true,
        clickHandler: onConnect,
      };
    default:
      return {
        buttonText: 'Unknown State',
        isClickable: false,
      };
  }
}; 