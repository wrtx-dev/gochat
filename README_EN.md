# Gemini AI Client

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

A desktop client for Gemini AI built with Electron + React + TypeScript

## Features

- Cross-platform desktop application (Windows/macOS, Linux support unverified)
- Modern UI interface (React + Tailwind CSS)
- Deep integration with Google Gemini AI, supporting:
  - Multi-turn conversation management
  - Streaming message responses
  - File upload and parsing (supports images, videos, etc.)
  - Function calling capability
  - Code execution and result return
  - Automatic conversation title generation
  - Custom system instructions
  - Support for image generation models
  - Search functionality integration
  - Conversation history persistence
- Markdown message rendering and Mermaid diagram support
- Multi-language internationalization (i18n) with support for:
  - Simplified Chinese (zh-CN)
  - English (en)
  - Japanese (ja)
  - Korean (ko)
- Model Context Protocol (MCP) integration
- Local data storage (Dexie)

## Installation

1. Clone repository:
   ```bash
   git clone https://github.com/wrtx-dev/gochat.git
   cd gochat
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

## Development

```bash
# Run in development mode
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Formatting
pnpm format
```

## Build

```bash
# Build for current platform
pnpm build

# Platform-specific builds
pnpm build:win    # Windows version
pnpm build:mac    # macOS version
```

## Tech Stack

- Frontend:
  - React 18
  - TypeScript
  - Tailwind CSS
  - shadcn/ui component library
  - Zustand state management
  - i18next internationalization

- Backend:
  - Electron
  - Vite build tool
  - Dexie (IndexedDB wrapper)

## License

Apache 2.0 © wrtx.dev
