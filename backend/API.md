# Route Optimizer API

## Endpoints

### Local
`http://localhost:8080`

### Production
`https://us-central1-route-optimizer-aebb7.cloudfunctions.net/optimize`

*Note: The production endpoint is restricted to authorized IP addresses only.*

---

## HTTP Method

POST

---

## Request Headers

| Header       | Value            |
| ------------ | ---------------- |
| Content-Type | application/json |

---

## Request Body

| Field          | Type               | Required | Description                                         |
| -------------- | ------------------ | -------- | --------------------------------------------------- |
| `destinations` | `list[str]`        | Yes      | 2–15 destination names or addresses                 |
| `mode`         | `"open"/"closed"`  | Yes      | Open route (no return) or closed (returns to start) |

---

## Request Example

```json
{
  "destinations": [
    "Antigua Guatemala",
    "Guatemala City",
    "Mixco"
  ],
  "mode": "open"
}
```

---

## Success Response

**HTTP 200**

```json
{
  "order": [1, 2, 0],
  "total_distance": 42900.0,
  "route_details": [
    "Guatemala City",
    "Mixco",
    "Antigua Guatemala"
  ]
}
```

---

## Error Responses

| Situation                  | HTTP Code |
| -------------------------- | --------- |
| Invalid payload            | 400       |
| IP not authorized          | 403       |
| Firebase token invalid     | 401       |
| Internal server error      | 500       |

### Invalid mode

```json
{ "error": "mode must be 'open' or 'closed'" }
```

### Invalid destinations count

```json
{ "error": "Destinations must contain between 2 and 15 places" }
```

### Distance exceeds 100 km

```json
{ "error": "La distancia entre 'X' y 'Y' (120.5 km) supera el límite de 100 km." }
```

### IP not authorized

```json
{ "error": "Forbidden: IP not allowed" }
```

---

## curl Test Examples

```bash
# Basic test (production)
curl -X POST https://us-central1-route-optimizer-aebb7.cloudfunctions.net/optimize \
  -H "Content-Type: application/json" \
  -d '{"destinations": ["Catedral Metropolitana, Guatemala City", "Antigua Guatemala"], "mode": "open"}'

# Basic test (local)
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"destinations": ["Catedral Metropolitana, Guatemala City", "Antigua Guatemala"], "mode": "open"}'

# Invalid payload test — expects 400
curl -X POST https://us-central1-route-optimizer-aebb7.cloudfunctions.net/optimize \
  -H "Content-Type: application/json" \
  -d '{"destinations": ["Solo un destino"], "mode": "open"}'

# Invalid mode test — expects 400
curl -X POST https://us-central1-route-optimizer-aebb7.cloudfunctions.net/optimize \
  -H "Content-Type: application/json" \
  -d '{"destinations": ["Antigua Guatemala", "Guatemala City"], "mode": "invalid"}'
```

---

## PowerShell Test Examples

```powershell
# Local
Invoke-WebRequest `
  -Uri "http://localhost:8080" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"destinations":["Antigua Guatemala","Guatemala City","Mixco"],"mode":"open"}'

# Production
Invoke-WebRequest `
  -Uri "https://us-central1-route-optimizer-aebb7.cloudfunctions.net/optimize" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"destinations":["Antigua Guatemala","Guatemala City","Mixco"],"mode":"open"}'
```

---

## IP Restriction

The Cloud Function validates the `X-Forwarded-For` header on every request.
Requests from unauthorized IPs receive **HTTP 403**.

To add a new IP, update the `ALLOWED_IPS` set in `main.py` and redeploy:

```bash
gcloud functions deploy optimize \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1
```

---

## Technologies Used

* Python 3.11
* Flask
* Functions Framework
* Google Cloud Functions (us-central1)
* Google Maps Distance Matrix API
* Genetic Algorithm (custom implementation)
