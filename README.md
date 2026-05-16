# Route Optimizer

> Optimización de Rutas con Algoritmo Genético

Python · React · Firebase · Google Maps API

## Description

<!-- TODO: Add project description and architecture overview -->

## Folder Structure

```
route-optimizer/
├── README.md
├── .gitignore
│
├── backend/
│   ├── pyproject.toml            # Python dependencies (uv)
│   ├── uv.lock
│   ├── main.py                   # Cloud Function entry point
│   ├── genetic_algorithm.py      # Genetic algorithm logic
│   ├── distance_matrix.py        # Distance Matrix API calls
│   └── .env.example              # Required env vars (no real values)
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/
│       │   ├── Map.jsx
│       │   ├── DestinationInput.jsx
│       │   └── RouteResult.jsx
│       └── services/
│           ├── firebase.js       # Firebase Auth config
│           └── cloudFunction.js  # Cloud Function calls
│
├── diagrams/
│   ├── flow.drawio
│   └── architecture.drawio
│
├── fases/                        # Waterfall phase plans
│   ├── fase_1_backend_core.md
│   ├── fase_2_cloud_function.md
│   ├── fase_3_frontend.md
│   └── fase_4_auth_ux_docs.md
│
└── Instrucciones/                # Project instructions
    └── Route_Optimizer.md
```

## Setup Instructions

<!-- TODO: Add step-by-step setup instructions -->

### Backend

```bash
cd backend
uv sync
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` in both `backend/` and `frontend/` directories and fill in your values.

## Technologies

- **Backend**: Python, uv
- **Frontend**: React, Vite
- **Authentication**: Firebase Authentication
- **Cloud Function**: Firebase/GCP Cloud Functions (Python)
- **Maps**: Google Maps JavaScript API, Distance Matrix API
- **Diagrams**: draw.io with official GCP icons

## Contributors

<!-- TODO: Add team members -->
