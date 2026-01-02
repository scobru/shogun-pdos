# Shogun NoBackend

A suite of **20+ minimalist web tools** with real-time sync via GunDB.
No backend required, privacy-first, 100% shareable.

## Features

- **Real-Time Sync**: Login once, sync across all your devices via GunDB
- **User Space**: Private data encrypted and synced in your personal space
- **URL Sharing**: Share any state via URL hash (works without login too)
- **Zero Tracking**: Your data never touches our servers (except Gun relay)
- **Minimalist Design**: Nothing Phone-inspired monochrome aesthetic

## Quick Start

```bash
yarn install
yarn start
```

Open `http://localhost:4000` to access the dashboard.

## Docker Deployment

### Using Docker Compose (recommended)

```bash
docker-compose up -d
```

### Using Docker directly

```bash
docker build -t shogun-nobackend .
docker run -d -p 4000:4000 --name shogun-nobackend shogun-nobackend
```

Access at `http://localhost:4000`

## Tools

### Productivity
| Tool | Description |
|------|-------------|
| **Note** | Minimal text editor with real-time sync |
| **List** | Task/checklist manager |
| **Calendar** | Event calendar with date picker |
| **Contacts** | Address book / directory |
| **Collect** | Bookmark/link collection manager |
| **Snippet** | Code snippet editor with syntax preview |

### Communication
| Tool | Description |
|------|-------------|
| **Chat** | Real-time chat rooms with room codes |
| **Poll** | Quick voting and polls (shareable) |

### Security
| Tool | Description |
|------|-------------|
| **Pass** | Encrypted password manager (AES-256) |
| **Secret** | Client-side encrypted text (AES-GCM) |

### Files & Media
| Tool | Description |
|------|-------------|
| **Files** | Local file manager with drag & drop |
| **Pic** | Image viewer/sharer (Base64 encoded) |
| **QR** | QR code generator and scanner |

### Utilities
| Tool | Description |
|------|-------------|
| **Calc** | Scientific calculator |
| **Split** | Bill splitter with tip calculator |
| **Alarm** | Alarm clock |
| **Timer** | Stopwatch and countdown |
| **Wheel** | Random decision wheel |
| **Where** | GPS location sharing |

## Architecture

```
┌─────────────┐     ┌─────────────┐
│   Browser   │◄───►│  GunDB      │
│  (Client)   │     │  Relay      │
└─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│ localStorage│ (offline fallback)
└─────────────┘
```

- **Authenticated users**: Data syncs to `gun.user().get('app-name')`
- **Anonymous users**: Data stored in URL hash + localStorage
- **Server**: Simple Express + Gun relay (`server.js`)

## Authentication

1. Go to `index.html`
2. Click **LOGIN** in the footer
3. Register or login with username/password
4. Your data now syncs across devices!

## Tech Stack

- Vanilla HTML/CSS/JS (no frameworks)
- [GunDB](https://gun.eco) for real-time sync
- [SEA](https://gun.eco/docs/SEA) for encryption/auth
- Web Crypto API for local encryption

## License

MIT

---
*Part of the [Shogun Ecosystem](https://shogun-eco.xyz)*
