# Route Optimizer

Route Optimizer is a secure web app that calculates an efficient route between 2 to 15 destinations in Guatemala. The frontend uses React, Firebase Authentication, Google Maps and Places. The backend runs as a Python Google Cloud Function, validates Firebase ID tokens, builds a Google Distance Matrix, and optimizes the route with a genetic algorithm.

## Architecture

1. The user opens the React app from Firebase Hosting or the local Vite server.
2. Firebase Authentication signs the user in with Google and returns an ID token.
3. The frontend collects destinations with Google Places autocomplete and sends them to the Cloud Function with `Authorization: Bearer <Firebase ID token>`.
4. The Cloud Function verifies the token with Firebase Admin, validates the payload, requests driving distances from Distance Matrix API, and runs the genetic algorithm.
5. The frontend renders the ordered route, total distance, numbered map markers, and a driving path.

Architecture and user-flow diagrams are available in `diagrams/architecture.drawio`, `diagrams/flow.drawio`, and their PNG exports.

## Folder Structure

```text
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

## Requirements

- Node.js and npm
- Python 3.11+
- `uv`
- Firebase project: `route-optimizer-aebb7`
- Enabled Firebase Auth provider: Google
- Enabled Google APIs: Maps JavaScript API, Places API, Distance Matrix API

## Environment Variables

Create local `.env` files from the examples. Do not commit real values.

Backend, `backend/.env`:

```env
GOOGLE_MAPS_API_KEY=
ALLOWED_ORIGIN=http://localhost:5173
GOOGLE_APPLICATION_CREDENTIALS=service-account.json
```

Frontend, `frontend/.env`:

```env
VITE_GOOGLE_MAPS_API_KEY=
VITE_CLOUD_FUNCTION_URL=http://localhost:8080
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=route-optimizer-aebb7.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=route-optimizer-aebb7
VITE_FIREBASE_APP_ID=
```

For local Firebase Admin verification, place the downloaded service account JSON at `backend/service-account.json`. This file is ignored by git and must never be uploaded.

## Local Setup

Install backend dependencies:

```bash
cd backend
uv sync
cp .env.example .env
```

Install frontend dependencies:

```bash
cd frontend
npm install
cp .env.example .env
```

Run the backend:

```bash
cd backend
uv run functions-framework --target=optimize --debug
```

Run the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`, sign in with Google, add destinations from the autocomplete menu, choose an open or closed route, and calculate.

## Testing

Backend unit tests:

```bash
cd backend
uv run pytest
```

Frontend production build:

```bash
cd frontend
npm run build
```

Manual acceptance checks:

- Unauthenticated users see only the login screen.
- Authenticated users can access the route calculator.
- Requests include `Authorization: Bearer <Firebase ID token>`.
- Missing or invalid tokens return `401`.
- Invalid payloads return `400`.
- The UI remains usable on desktop and mobile widths.

## Deployment

Build and deploy the frontend to Firebase Hosting:

```bash
cd frontend
npm run build
npx firebase deploy --only hosting
```

Production Hosting URL:

```text
https://route-optimizer-aebb7.web.app
```

Redeploy the Cloud Function after auth changes and set the production CORS origin:

```bash
cd backend
gcloud functions deploy optimize \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --set-env-vars ALLOWED_ORIGIN=https://route-optimizer-aebb7.web.app,GOOGLE_MAPS_API_KEY=YOUR_BACKEND_MAPS_KEY
```

In GCP, Firebase Admin uses Application Default Credentials. Do not upload `service-account.json` to the Cloud Function.

## Troubleshooting

- `401`: sign in again and confirm the frontend sends the Firebase ID token.
- CORS error: confirm `ALLOWED_ORIGIN` matches the exact frontend origin.
- Empty map or autocomplete failure: confirm the frontend Maps key has Maps JavaScript API and Places API enabled.
- Distance errors: confirm the backend key has Distance Matrix API enabled and destinations are within the 100 km limit.
- Local auth verification failure: confirm `backend/service-account.json` exists and `GOOGLE_APPLICATION_CREDENTIALS=service-account.json`.

## Technologies

- React + Vite
- Firebase Authentication
- Firebase Hosting
- Google Cloud Functions
- Firebase Admin SDK
- Google Maps JavaScript API
- Google Places API
- Google Distance Matrix API
- Python, Functions Framework, uv
- Genetic algorithm for route optimization

## Contributors

- Route Optimizer team
