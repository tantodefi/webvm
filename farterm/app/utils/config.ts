export const config = {
  // Terminal settings
  DEFAULT_TERMINAL_ROWS: 24,
  DEFAULT_TERMINAL_COLS: 80,

  // CheerpX settings
  DEBIAN_IMAGE_URL: 'https://webvm.io/debian.ext2',
  CHEERPX_URL: 'https://webvm.io/cheerpx.js',

  // Networking settings
  TAILSCALE_URL: 'https://webvm.io/tailscale.js',
  TAILSCALE_AUTHKEY: process.env.NEXT_PUBLIC_TAILSCALE_AUTHKEY || '',

  // AI settings
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  ANTHROPIC_MODEL: 'claude-3-opus-20240229',

  // App settings
  APP_NAME: 'FarTerm',
  APP_VERSION: '1.0.0',
  APP_DESCRIPTION: 'A social Linux terminal environment running in your browser',
  APP_AUTHOR: 'Your Name',
  APP_REPOSITORY: 'https://github.com/yourusername/farterm',
  APP_WEBSITE: 'https://farterm.network',
  APP_DISCORD: 'https://discord.gg/farterm',
  APP_DOCS: 'https://docs.farterm.network',

  // Farcaster configuration
  FARCASTER_HUB_URL: process.env.NEXT_PUBLIC_FARCASTER_HUB_URL || 'https://nemes.farcaster.xyz:2281',
  FARCASTER_NETWORK: process.env.NEXT_PUBLIC_FARCASTER_NETWORK || 'mainnet',
  
  // VM settings
  CPU_ACTIVITY_POLL_INTERVAL: 1000,
  DISK_ACTIVITY_POLL_INTERVAL: 2000,
  
  // UI settings
  NOTIFICATION_TIMEOUT: 3000,
  MAX_CPU_EVENTS: 100,
  MAX_DISK_LATENCIES: 50
}; 