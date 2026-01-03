# PocketAI Expo App

A mobile UI for PocketAI - run AI models locally on your Android device.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/mithun50/PocketAi-Expo/blob/main/build_apk.ipynb)

## Features

- **Setup Wizard**: Guides you through installing Termux and PocketAI
- **Chat Interface**: Conversation with AI, history saved locally
- **Real-time Streaming**: See AI responses appear token-by-token (ChatGPT-style)
- **Model Management**: Install, remove, and switch between AI models
- **Smart Connection**: Automatic reconnection with exponential backoff
- **Offline First**: Everything runs locally, no internet needed after setup

## Prerequisites

- Android device with 2GB+ RAM
- [Termux](https://f-droid.org/en/packages/com.termux/) from F-Droid
- [PocketAI](https://github.com/mithun50/PocketAi) installed in Termux

## Installation

### 1. Install Expo dependencies

```bash
cd pocketai-expo
npm install
```

### 2. Run the app

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android emulator.

### 3. Complete setup in the app

The app will guide you through:
1. Installing Termux
2. Installing PocketAI in Termux
3. Starting the API server
4. Connecting to the backend

## Architecture

```
┌─────────────────────┐      ┌─────────────────────┐
│   PocketAI Expo     │◄────►│   Termux + PocketAI │
│   (React Native)    │      │   (API on :8081)    │
└─────────────────────┘      └─────────────────────┘
         │                            │
         │                            ▼
         │                   ┌─────────────────────┐
         └──────────────────►│   AI Model (local)  │
                             │   (GGUF format)     │
                             └─────────────────────┘
```

## API Endpoints

The app communicates with PocketAI's REST API:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Check connection (instant) |
| `/api/status` | GET | Get version and active model (cached 30s) |
| `/api/models` | GET | List available models |
| `/api/models/installed` | GET | List installed models |
| `/api/models/install` | POST | Install a model |
| `/api/models/use` | POST | Activate a model |
| `/api/chat` | POST | Send message (blocking) |
| `/api/chat/stream` | POST | Send message (SSE streaming) |

## Streaming Chat

The app uses Server-Sent Events (SSE) for real-time streaming:

```
App sends message → Backend generates tokens → Tokens stream to app → UI updates live
```

**Features:**
- Tokens appear as they're generated (ChatGPT-like experience)
- Animated cursor shows active generation
- "Live" badge with pulsing indicator during streaming
- Automatic fallback to blocking mode if streaming fails

**Fallback Behavior:**
If streaming fails (network issues, timeout), the app automatically:
1. Falls back to `/api/chat` (blocking endpoint)
2. Shows "non-streaming" badge on the response
3. Displays full response at once

## Connection Management

The app includes smart connection handling:

**Polling Intervals:**
| State | Interval | Notes |
|-------|----------|-------|
| Disconnected | 5 seconds | Tries to reconnect quickly |
| Connected | 15 seconds | Reduces polling to save resources |
| During chat | Paused | No polling while AI is generating |

**Features:**
- Automatic address discovery (localhost, 127.0.0.1, device IP)
- Exponential backoff on failures (up to 30 seconds)
- Instant resume after successful chat
- Status caching to reduce API calls

## Project Structure

```
pocketai-expo/
├── app/                    # Expo Router pages
│   ├── (setup)/           # Setup wizard screens
│   └── (main)/            # Main app tabs
├── src/
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API and storage
│   ├── types/             # TypeScript types
│   └── constants/         # Theme and config
└── assets/                # Images and fonts
```

## Daily Usage

After phone restart, start PocketAI in Termux:

```bash
source ~/.pocketai_env && pai api web
```

Then open this app - it will connect automatically.

The `pai api web` command starts both the API and a web dashboard at http://localhost:8081

## License

MIT
