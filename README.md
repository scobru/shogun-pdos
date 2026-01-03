# PDOS 01

A suite of **19 minimalist web tools** with real-time sync via GunDB.
No backend required, privacy-first, 100% shareable.

## Features

- **Real-Time Sync**: Login once, sync across all your devices via GunDB
- **End-to-End Encryption**: All synced data is encrypted with your SEA keypair
- **User Space**: Private data encrypted and synced in your personal space
- **URL Sharing**: Share any state via URL hash (works without login too)
- **Zero Tracking**: Your data never touches our servers (except Gun relay)
- **Minimalist Design**: Nothing Phone-inspired monochrome aesthetic

## Quick Start

```bash
yarn install
yarn start
```

Open `http://localhost:8765` to access the dashboard.

## Docker Deployment

### Using Docker Compose (recommended)

```bash
docker-compose up -d
```

### Using Docker directly

```bash
docker build -t pdos-01 .
docker run -d -p 8765:8765 --name pdos-01 pdos-01
```

Access at `http://localhost:8765`


## Tools

### Productivity
| Tool | Description |
|------|-------------|
| **Notes** | Multi-note manager with sidebar |
| **Pad** | Distraction-free single page text editor |
| **List** | Task/checklist manager |
| **Calendar** | Event calendar with date picker |
| **Contacts** | Address book / directory |
| **Collect** | Bookmark/link collection manager |
| **Snippet** | Code snippet editor with syntax preview |
| **Habit** | Daily habit tracker with streaks |
| **Kanban** | Drag-and-drop task board |

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

### Media
| Tool | Description |
|------|-------------|
| **Pic** | Image viewer/sharer (Base64 encoded) |
| **QR** | QR code generator and scanner |
| **Amp** | Audio player with local library |
| **Drive** | File manager with cloud sync |

### Utilities
| Tool | Description |
|------|-------------|
| **Calc** | Scientific calculator |
| **Split** | Bill splitter with tip calculator |
| **Alarm** | Alarm clock |
| **Timer** | Stopwatch and countdown |
| **Wheel** | Random decision wheel |
| **Where** | GPS location sharing |
| **Stocks** | Crypto & stock price tracker |

### Games
| Tool | Description |
|------|-------------|
| **Chess** | Two-player chess |
| **Dino** | Chrome dino runner clone |
| **Battle** | Turn-based RPG (vs CPU or Player) |

## Features

- **PWA Support**: Install as app, works offline via Service Worker
- **Export/Import**: Backup all data as JSON
- **Theme Toggle**: Dark/Light mode
- **Real-time Sync**: GunDB with E2E encryption


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

## Security

When logged in, all data synced to GunDB is **end-to-end encrypted** using your SEA keypair:

- **Encryption**: `SEA.encrypt(data, user._.sea)` before writing to Gun
- **Decryption**: `SEA.decrypt(data, user._.sea)` when reading from Gun
- **Fallback**: Anonymous users data is stored in URL hash + localStorage (unencrypted on Gun)

Apps with E2E encryption:
- Calendar, Contacts, Collect, List, Notes, Pad, Split

Additional encryption:
- **Pass** (password manager): Uses AES-GCM with master password (double encryption)

## Tech Stack

- Vanilla HTML/CSS/JS (no frameworks)
- [GunDB](https://gun.eco) for real-time sync
- [SEA](https://gun.eco/docs/SEA) for encryption/auth
- Web Crypto API for local encryption

## License

MIT

---
*Part of the [PDOS Ecosystem](https://shogun-eco.xyz)*
