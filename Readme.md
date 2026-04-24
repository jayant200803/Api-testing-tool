# API Pulse — Full-Stack API Testing Platform

> A Postman-inspired API testing tool built from scratch with React, Node.js, MongoDB, and JWT authentication. Supports multi-tab requests, environment variable interpolation, collections, auto-saved history, and Google OAuth — all inside a custom dark-theme UI.

---

## Live Demo

| Layer | Platform | Link |
|---|---|---|
| Frontend | Render Static Site | _(deploy to get link)_ |
| Backend | Render Web Service | _(deploy to get link)_ |
| Database | MongoDB Atlas | _(cloud-hosted)_ |

---

## What This Project Does

Most developers test APIs with Postman. This project **re-implements that core functionality as a web app** — entirely from scratch. It's not a wrapper around any existing testing library; every feature (proxy server, environment interpolation, JWT auth, OAuth, collection management) is hand-rolled.

A user can:
1. Open the app and instantly send an HTTP request without logging in (Guest Mode)
2. Sign in with Google or Email/Password to persist their data
3. Build requests with custom headers, body, query params, and auth
4. View color-coded responses with timing and size metadata
5. Save requests to named collections (like Postman folders)
6. Use environments with `{{variable}}` syntax across all fields
7. Browse auto-saved request history grouped by date

---

## Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| React 18 + Vite 5 | UI framework + fast bundler with HMR |
| Axios 1.4 | HTTP client with JWT interceptor |
| react18-json-view | Syntax-highlighted JSON response viewer |
| React Context API | Global auth state (no Redux needed) |
| Custom CSS | Dark theme with CSS variables, no UI library |

### Backend
| Tool | Purpose |
|---|---|
| Node.js + Express 4.18 | REST API server |
| Mongoose 8 | MongoDB ODM with schema validation |
| Axios 1.4 | Proxy engine — forwards requests to external APIs |
| jsonwebtoken 9 | JWT generation + verification (30-day tokens) |
| bcryptjs 2.4 | Password hashing (salt rounds: 10) |
| google-auth-library 9 | Google OAuth 2.0 ID token verification |
| CORS | Cross-origin request handling |

### Infrastructure
| Tool | Purpose |
|---|---|
| MongoDB Atlas | Cloud database (5 collections) |
| JSON file fallback | Local dev storage if Mongo URI not set |

---

## Architecture Overview

```
Browser (React)
    │
    │  HTTP Requests (Axios + JWT header)
    ▼
Express Backend (Node.js)
    ├── /api/auth      ← JWT issuance, Google OAuth, bcrypt login
    ├── /api/proxy     ← Forwards user requests to external APIs (CORS bypass)
    ├── /api/history   ← Auto-save every request + response
    ├── /api/collections ← CRUD for saved request folders
    └── /api/environments ← CRUD for env variable sets
    │
    ▼
MongoDB Atlas
    ├── users
    ├── history
    ├── collections
    ├── collection_items
    └── environments
```

The core insight: the **backend acts as a CORS proxy**. The browser sends the request to the Express server, which forwards it to the actual external API using Axios, and returns the response. This solves the CORS problem that would otherwise block browser-to-API calls.

---

## Features In Depth

### Multi-Tab Request Builder
- Open unlimited request tabs simultaneously, just like Postman
- Tabs show HTTP method color-dot + auto-generated name (method + endpoint path)
- Each tab maintains its own independent state

### Request Configuration
- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- **Query Params**: Key-value table with per-row enable/disable toggle
- **Headers**: Custom headers with enable/disable per row
- **Body Types**: JSON, Plain Text, Form Data, URL-Encoded
- **Auth Types**:
  - Bearer Token (injects `Authorization: Bearer <token>` header)
  - Basic Auth (Base64 encodes `username:password`)
  - API Key (inject into header or query param with custom key name)

### Response Viewer
- Status badge color-coded by range: `2xx` green, `3xx` blue, `4xx` orange, `5xx` red
- Shows response time in ms, response size in KB/MB, header count
- **Pretty mode**: syntax-highlighted, collapsible JSON tree
- **Raw mode**: formatted JSON string or plain text
- Headers tab: full response headers in table format
- Copy response body to clipboard
- Download response as `.json` file

### Environment Variables
- Create multiple environments: `development`, `staging`, `production`
- Define variables as key-value pairs
- Use `{{variable_name}}` syntax anywhere: URL, headers, body, query params
- Regex-based interpolation runs at send time — no UI re-render needed
- Example: `https://{{base_url}}/users/{{user_id}}`

### Collections
- Create named collections to group related requests
- Add any current request to a collection with a custom name
- Expand/collapse folder view
- Click any saved request to load it in a new tab
- Delete entire collections (cascades to all items) or individual items

### History
- Every request/response pair auto-saved to the database
- Grouped by date in the sidebar
- Search by URL or HTTP method
- Click any history item to reload it as a new tab
- Delete individual entries or clear all

### Authentication
- **Google OAuth 2.0**: One-click sign-in via Google Identity Services
- **Email/Password**: Register + login with bcrypt-hashed passwords
- **JWT**: 30-day tokens stored in localStorage, auto-attached to every API request via Axios interceptor
- **Guest Mode**: No login required — requests still work, data stored locally only

---

## Project File Structure (Explained Simply)

```
├── backend/
│   └── src/
│       ├── server.js                  # App entry point — Express setup, middleware, route mounting
│       ├── middleware/
│       │   └── auth.middleware.js     # Reads JWT from Authorization header, attaches user to req
│       ├── models/
│       │   └── user.model.js         # Mongoose schema: email, name, picture, google_id, password
│       ├── routes/
│       │   ├── auth.routes.js        # POST /register, /login, /google — issues JWTs
│       │   ├── proxy.routes.js       # POST /proxy — the CORS bypass engine
│       │   ├── history.routes.js     # CRUD for request history
│       │   ├── collections.routes.js # CRUD for collections + their items
│       │   └── environments.routes.js# CRUD for environment variable sets
│       └── services/
│           └── supabase.service.js   # DB abstraction: MongoDB Atlas or JSON file fallback
│
└── frontend/
    └── src/
        ├── main.jsx                  # React root mount
        ├── App.jsx                   # Top-level layout: tabs, environment bar, auth gate
        ├── context/
        │   └── AuthContext.jsx       # React Context: current user, token, login/logout actions
        ├── services/
        │   └── api.service.js        # Axios instance with base URL + JWT interceptor
        ├── pages/
        │   └── LoginPage.jsx         # Auth UI: Google button + email/password form + guest mode
        └── components/
            ├── layout/
            │   └── LeftSidebar.jsx   # Three panels: Collections, History, Environments
            ├── request/
            │   ├── RequestBuilder.jsx# URL bar, method picker, tab panels (params/auth/headers/body)
            │   └── ResponsePanel.jsx # Response display: status, timing, body, headers
            ├── shared/
            │   └── KeyValueTable.jsx # Reusable key-value row editor used in params, headers, body
            └── environment/
                └── EnvironmentModal.jsx # Modal to create/edit/delete environments and variables
```

---

## API Endpoints Reference

### Auth — `/api/auth`
| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Create account with email + password |
| POST | `/auth/login` | Login, returns JWT |
| POST | `/auth/google` | Verify Google credential, return JWT |
| GET | `/auth/me` | Get current user profile (requires JWT) |

### Proxy — `/api/proxy`
| Method | Route | Description |
|---|---|---|
| POST | `/proxy` | Forward any HTTP request to an external API |

**Request body:**
```json
{
  "url": "https://api.example.com/users",
  "method": "GET",
  "headers": { "Accept": "application/json" },
  "params": { "page": "1" },
  "body": null
}
```

### History — `/api/history`
| Method | Route | Description |
|---|---|---|
| POST | `/history` | Save request + response pair |
| GET | `/history` | Fetch last 100 entries |
| DELETE | `/history/:id` | Delete one entry |
| DELETE | `/history/all` | Clear all history |

### Collections — `/api/collections`
| Method | Route | Description |
|---|---|---|
| POST | `/collections` | Create collection |
| GET | `/collections` | List all collections |
| PUT | `/collections/:id` | Rename collection |
| DELETE | `/collections/:id` | Delete collection + all items |
| POST | `/collections/:id/items` | Add request to collection |
| GET | `/collections/:id/items` | List requests in collection |
| PUT | `/collections/:id/items/:itemId` | Update saved request |
| DELETE | `/collections/:id/items/:itemId` | Remove from collection |

### Environments — `/api/environments`
| Method | Route | Description |
|---|---|---|
| GET | `/environments` | List all environments |
| POST | `/environments` | Create environment |
| PUT | `/environments/:id` | Update variables |
| DELETE | `/environments/:id` | Delete environment |

---

## Getting Started (Local)

### Prerequisites
- Node.js 18+
- MongoDB Atlas URI (or leave blank for JSON file fallback)
- Google Cloud project with OAuth 2.0 credentials (optional)

### Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/apitool
JWT_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
PROXY_TIMEOUT_MS=15000
```

```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_BASE=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

```bash
npm run dev
```

App runs at `http://localhost:5173`.

---

## Security Decisions

| Concern | Solution |
|---|---|
| SSRF attacks | Proxy blocks requests to `127.0.0.1`, `localhost`, `::1` |
| Password storage | bcrypt with 10 salt rounds — never stored in plain text |
| Auth tokens | JWT HS256, 30-day expiry, validated on every protected route |
| OAuth | Google ID token verified server-side via `google-auth-library` |
| CORS | Express `cors()` middleware, configurable origins |
| Request timeout | 15s proxy timeout prevents hanging connections |

---

## Database Schema

**users**
```js
{ email, name, picture, google_id, password (bcrypt), created_at }
```

**history**
```js
{ user_id, url, method, headers, params, body, response, created_at }
```

**collections**
```js
{ user_id, name, meta, created_at }
```

**collection_items**
```js
{ collection_id, name, request_data, created_at }
```

**environments**
```js
{ user_id, name, variables: [{id, key, value, enabled}], created_at }
```

---

## What I Built vs What I Learned

**Built from scratch:**
- CORS proxy pattern (no third-party proxy library)
- JWT auth flow (register → hash → sign → verify → protect routes)
- Google OAuth server-side token verification
- `{{variable}}` interpolation engine using regex
- Multi-tab state architecture in React without Redux
- Dual-database abstraction (Mongo Atlas → JSON file fallback)

**Key lessons:**
- Why browsers can't make arbitrary cross-origin requests (CORS) — and how a server-side proxy solves it cleanly
- How OAuth 2.0 ID tokens work and why you verify them server-side
- How to design a React app where every tab is independent state without global state explosion

---

## Author

**Jayant** — [GitHub](https://github.com/jayant200803) · [Email](mailto:jayantunited20@gmail.com)

Built as a portfolio project demonstrating full-stack proficiency: REST API design, authentication, database modeling, and production-ready frontend architecture.
