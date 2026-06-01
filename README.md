# Route Optimizer

Route Optimizer is a secure web application that calculates an efficient driving route between 2 and 15 destinations in Guatemala. The frontend is built with React and Vite, uses Firebase Authentication (Google Sign-In), and renders results on an interactive Google Map. The backend runs as a Python Google Cloud Function that validates Firebase ID tokens, fetches driving distances from the Distance Matrix API, and optimizes the visit order with a genetic algorithm.

## Architecture

```
User (Browser)
    │  Google Sign-In
    ▼
Firebase Authentication  ──►  Firebase ID Token
    │
    ▼
React Frontend (Firebase Hosting / Vite dev server)
    │  POST /optimize
    │  Authorization: Bearer <token>
    │  { destinations, mode }
    ▼
Google Cloud Function (Python)
    ├── Verify Firebase token (Firebase Admin SDK)
    ├── Validate payload (2–15 destinations, open|closed mode)
    ├── Fetch N×N driving distances (Distance Matrix API)
    └── Run genetic algorithm → optimal order + total distance
    │
    ▼
Frontend renders numbered map markers, polyline route, and result list
```

Architecture and user-flow diagrams are available in `diagrams/architecture.drawio`, `diagrams/flow.drawio`, and their PNG exports.

## Folder Structure

```
route-optimizer/
├── backend/
│   ├── main.py                 # Cloud Function entry point
│   ├── distance_matrix.py      # Google Distance Matrix integration
│   ├── genetic_algorithm.py    # Route optimization logic
│   ├── mock_matrix.py          # Mock data for local algorithm tests
│   ├── API.md                  # HTTP API contract
│   ├── pyproject.toml          # uv dependencies
│   ├── uv.lock
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   └── services/
│   ├── package.json
│   └── .env.example
├── diagrams/
│   ├── architecture.drawio
│   ├── architecture.png
│   ├── flow.drawio
│   └── flow.png
└── README.md
```

---

## Prerequisites

Before cloning the repo, make sure you have the following installed and configured.

### Tools

**Node.js 18+ and npm**
Download from https://nodejs.org or use a version manager like `nvm`.

**Python 3.11+**
Download from https://python.org or use `pyenv`.

**uv** (Python package manager)
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```
Then restart your terminal so the `uv` command is available.

**Google Cloud SDK** (required for deployment, optional for local dev)
Follow the instructions at https://cloud.google.com/sdk/docs/install, then run:
```bash
gcloud auth login
gcloud config set project route-optimizer-aebb7
```

**Firebase CLI** (required for deployment, optional for local dev)
```bash
npm install -g firebase-tools
firebase login
```

### Google Cloud & Firebase setup

You need a Firebase project with the following already configured. The project used in production is `route-optimizer-aebb7`; to use your own, replace every reference to that project ID throughout this guide.

**1. Enable Firebase Authentication**
In the [Firebase Console](https://console.firebase.google.com) → your project → Authentication → Sign-in method → enable **Google**.

**2. Enable Google APIs**
In the [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Library, enable:
- Maps JavaScript API
- Places API
- Distance Matrix API

**3. Create two API keys**

Go to APIs & Services → Credentials → Create credentials → API key.

- **Frontend key**: restrict it to HTTP referrers (your domain + `localhost:5173`) and to Maps JavaScript API and Places API.
- **Backend key**: restrict it to IP addresses (your Cloud Function's outbound IP or unrestricted for dev) and to Distance Matrix API only.

Keep both keys — you will need them when filling in the `.env` files below.

**4. Download a Firebase service account key (local dev only)**

In the Firebase Console → Project Settings → Service accounts → Generate new private key. Save the downloaded JSON file as `backend/service-account.json`. This file is git-ignored and must never be committed.

**5. Find your Firebase app credentials**

In the Firebase Console → Project Settings → General → Your apps → Web app. You will see values for `apiKey`, `authDomain`, `projectId`, and `appId`. You need these for the frontend `.env`.

---

## Local Setup

**1. Clone the repository**

```bash
git clone <repo-url>
cd route-optimizer
```

**2. Configure the backend**

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in:

```env
GOOGLE_MAPS_API_KEY=<your backend API key>
ALLOWED_ORIGIN=http://localhost:5173
GOOGLE_APPLICATION_CREDENTIALS=service-account.json
```

Make sure `backend/service-account.json` exists (downloaded in step 4 above).

Then install dependencies:

```bash
uv sync
```

**3. Configure the frontend**

```bash
cd ../frontend
cp .env.example .env
```

Open `frontend/.env` and fill in:

```env
VITE_GOOGLE_MAPS_API_KEY=<your frontend API key>
VITE_CLOUD_FUNCTION_URL=http://localhost:8080
VITE_FIREBASE_API_KEY=<apiKey from Firebase console>
VITE_FIREBASE_AUTH_DOMAIN=route-optimizer-aebb7.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=route-optimizer-aebb7
VITE_FIREBASE_APP_ID=<appId from Firebase console>
```

Then install dependencies:

```bash
npm install
```

**4. Run the backend**

```bash
cd ../backend
uv run functions-framework --target=optimize --debug
```

The function listens on `http://localhost:8080`.

**5. Run the frontend** (open a second terminal)

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`, sign in with Google, add destinations using the autocomplete field, choose open or closed route mode, and click **Calculate**.

---

## API Reference

The Cloud Function exposes a single HTTP endpoint.

**`POST /optimize`**

Headers:
```
Content-Type: application/json
Authorization: Bearer <Firebase ID token>
```

Request body:
```json
{
  "destinations": [
    "Antigua Guatemala, Guatemala",
    "Panajachel, Sololá",
    "Chichicastenango, Quiché"
  ],
  "mode": "open"
}
```

- `destinations`: array of 2–15 place name strings or coordinate strings
- `mode`: `"open"` (start ≠ end) or `"closed"` (return to origin)

Success response `200`:
```json
{
  "order": [0, 2, 1],
  "total_distance": 142300,
  "route_details": [
    { "from": "Antigua Guatemala, Guatemala", "to": "Chichicastenango, Quiché", "distance": 89500 },
    { "from": "Chichicastenango, Quiché", "to": "Panajachel, Sololá", "distance": 52800 }
  ]
}
```

- `order`: indices into the original `destinations` array, in optimal visit order
- `total_distance`: total driving distance in meters
- `route_details`: each leg of the optimized route

Error responses:
- `400` — missing fields, fewer than 2 or more than 15 destinations, invalid mode, or destinations exceed the 100 km radius limit
- `401` — missing or invalid Firebase ID token
- `500` — internal error (Distance Matrix API failure, etc.)

---

## Testing

**Backend unit tests**

```bash
cd backend
uv run pytest
```

**Frontend production build check**

```bash
cd frontend
npm run build
```

**Manual acceptance checks**

- Unauthenticated users see only the login screen.
- Authenticated users can access the route calculator.
- Every request includes `Authorization: Bearer <Firebase ID token>`.
- Missing or invalid tokens return `401`.
- Invalid payloads return `400`.
- The UI is usable on both desktop and mobile viewports.

---

## Deployment

### Frontend → Firebase Hosting

If this is your first deploy, initialize Firebase Hosting first:

```bash
cd frontend
npm run build
npx firebase init hosting
# Select: use existing project → route-optimizer-aebb7
# Public directory: dist
# Single-page app: yes
# Don't overwrite dist/index.html
```

For subsequent deploys:

```bash
cd frontend
npm run build
npx firebase deploy --only hosting
```

Production URL: `https://route-optimizer-aebb7.web.app`

### Backend → Google Cloud Functions

```bash
cd backend
gcloud functions deploy optimize \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --set-env-vars ALLOWED_ORIGIN=https://route-optimizer-aebb7.web.app,GOOGLE_MAPS_API_KEY=YOUR_BACKEND_MAPS_KEY
```

In GCP, Firebase Admin uses Application Default Credentials automatically. Do not upload `service-account.json` to the Cloud Function.

After deploying, copy the function URL from the output and set it as `VITE_CLOUD_FUNCTION_URL` in your frontend production environment (or in the Firebase Hosting environment config), then redeploy the frontend.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|-------------|
| `401` response | Token missing or expired — sign in again and confirm the frontend sends the `Authorization` header. |
| CORS error | `ALLOWED_ORIGIN` doesn't exactly match the frontend origin (including protocol and port). |
| Empty map or broken autocomplete | Frontend Maps API key is missing the Maps JavaScript API or Places API permission. |
| Distance errors | Backend key is missing the Distance Matrix API permission, or destinations exceed the 100 km radius limit. |
| Local auth failure | `backend/service-account.json` is missing or `GOOGLE_APPLICATION_CREDENTIALS` is not set to `service-account.json`. |
| `firebase deploy` fails | Run `firebase login` and confirm the active project with `firebase projects:list`. |
| `uv` command not found | Restart your terminal after installing uv, or add `~/.cargo/bin` to your PATH. |

---

## How the Genetic Algorithm Works

The core optimization problem is the **Travelling Salesman Problem (TSP)**: given N destinations and the driving distances between every pair, find the visit order that minimizes total distance. TSP is NP-hard, meaning exact solutions become impractical as N grows. A genetic algorithm (GA) finds a very good solution quickly without exhaustive search.

### Key concepts

**Chromosome**
Each candidate solution is encoded as a permutation of destination indices. For 4 destinations `[A, B, C, D]`, the chromosome `[2, 0, 3, 1]` means "visit C → A → D → B". Every chromosome always has length N.

**Population**
The algorithm maintains P chromosomes simultaneously. Diversity across the population lets it explore many different route orderings in parallel.

**Fitness function**
Each chromosome is scored by summing the driving distances of the route it encodes, using the pre-fetched N×N distance matrix. Lower total distance = higher fitness. In closed-route mode the return leg (last destination back to first) is included; in open-route mode it is not.

**Selection**
Tournament selection picks k random individuals from the population and returns the fittest. This is simple, fast, and preserves diversity better than purely fitness-proportional methods.

**Crossover (Order Crossover — OX)**
Two parent chromosomes produce an offspring that inherits a random contiguous slice from parent A, then fills the remaining positions with destinations from parent B in their original order, skipping any already present. This guarantees every destination appears exactly once.

**Mutation**
After crossover, each offspring has a small probability of mutation. A swap mutation picks two random positions and exchanges them, introducing variation and preventing premature convergence to a local optimum.

**Stopping criterion**
The algorithm runs for a fixed number of generations G, or stops early if the best fitness has not improved for a configurable number of consecutive generations (stagnation). The best chromosome seen across all generations is returned.

### Complexity

Let N = destinations, P = population size, G = generations.

- Fitness evaluation of one chromosome: **O(N)** — sum N−1 (or N for closed) edge weights from the matrix.
- Per generation: evaluate P chromosomes + selection + crossover + mutation — overall **O(P·N)**.
- Total: **O(G·P·N)**.
- Space: **O(P·N)** for the population, **O(N²)** for the distance matrix.

For this application N ≤ 15, so even generous parameters (P = 200, G = 500) require only ~1.5 million matrix lookups — negligible on any modern CPU. The distance matrix is fetched once from the Google API before the algorithm runs; all fitness evaluations use in-memory lookups, keeping the optimization loop free of network calls.

### Practical tuning

- Smaller P and G give faster responses; larger values improve solution quality.
- Elitism (always copying the best individual unchanged into the next generation) prevents losing good solutions.
- A fixed random seed makes results reproducible in unit tests.
- Optionally, 2-opt local search applied to the best individual after the GA finishes can further improve quality with minimal added cost.

---

## Technologies

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite |
| Authentication | Firebase Authentication (Google provider) |
| Hosting | Firebase Hosting |
| Backend | Python 3.11, Functions Framework |
| Dependency management | uv |
| Serverless compute | Google Cloud Functions |
| Token verification | Firebase Admin SDK |
| Mapping | Google Maps JavaScript API |
| Place search | Google Places API |
| Distance data | Google Distance Matrix API |
| Route optimization | Genetic algorithm (custom implementation) |
