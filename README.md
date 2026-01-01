# PocketAI Expo App

A mobile UI for PocketAI - run AI models locally on your Android device.

## Features

- **Setup Wizard**: Guides you through installing Termux and PocketAI
- **Chat Interface**: Conversation with AI, history saved locally
- **Model Management**: Install, remove, and switch between AI models
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
| `/api/health` | GET | Check connection |
| `/api/status` | GET | Get version and active model |
| `/api/models` | GET | List available models |
| `/api/models/installed` | GET | List installed models |
| `/api/models/install` | POST | Install a model |
| `/api/models/use` | POST | Activate a model |
| `/api/chat` | POST | Send message to AI |

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
source ~/.pocketai_env && pai api start
```

Then open this app - it will connect automatically.

## License

MIT
