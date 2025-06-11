# FarTerm

A social Linux terminal environment running in your browser via WebAssembly, built on Farcaster.

## Features

- 🖥️ Linux environment powered by CheerpX
- 💾 Persistent storage with IndexedDB
- 🔒 Secure networking via Tailscale
- 🤖 AI assistance with Claude
- 🌐 Social features with Farcaster

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [CheerpX](https://cheerpx.io/) - x86 virtualization in WebAssembly
- [xterm.js](https://xtermjs.org/) - Terminal emulation
- [Tailscale](https://tailscale.com/) - Secure networking
- [Claude](https://anthropic.com/) - AI assistance
- [Farcaster](https://farcaster.xyz/) - Social features
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Tailwind CSS](https://tailwindcss.com/) - Styling

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/farterm.git
   cd farterm
   ```

2. Install dependencies:
```bash
npm install
   ```

3. Set up environment variables:
```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your API keys:
   - `ANTHROPIC_API_KEY` - Claude API key
   - `NEXT_PUBLIC_TAILSCALE_AUTHKEY` - Tailscale auth key
   - `NEXT_PUBLIC_FARCASTER_HUB_URL` - Farcaster hub URL
   - `NEXT_PUBLIC_FARCASTER_NETWORK` - Farcaster network (mainnet/testnet)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

- `app/` - Next.js app directory
  - `components/` - React components
    - `Terminal.tsx` - xterm.js integration
    - `WebVM.tsx` - Main component
    - `CpuTab.tsx` - CPU monitoring
    - `DiskTab.tsx` - Disk monitoring
    - `AnthropicTab.tsx` - Claude AI integration
    - `SideBar.tsx` - Navigation sidebar
  - `utils/` - Utility functions
    - `activities.ts` - Activity monitoring
    - `anthropic.ts` - Claude AI integration
    - `config.ts` - Configuration
    - `network.ts` - Tailscale integration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [WebVM](https://webvm.io/) - Inspiration and CheerpX integration
- [Farcaster](https://farcaster.xyz/) - Social protocol
- [Anthropic](https://anthropic.com/) - Claude AI
- [Tailscale](https://tailscale.com/) - Networking
