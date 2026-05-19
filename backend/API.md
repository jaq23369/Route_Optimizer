# Route Optimizer API

## Local Endpoint

http://localhost:8080

---

## HTTP Method

POST

---

## Request Headers

| Header       | Value            |
| ------------ | ---------------- |
| Content-Type | application/json |

---

## Request Example

```json id="s0ljlwm"
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

```json id="2jlwmx"
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

## Error Examples

### Invalid mode

```json id="jlwm3n"
{
  "error": "mode must be 'open' or 'closed'"
}
```

### Invalid destinations count

```json id="jlwm4o"
{
  "error": "Destinations must contain between 2 and 15 places"
}
```

### Distance exceeds 100 km

```json id="jlwm5p"
{
  "error": "La distancia entre destinos supera el límite de 100 km."
}
```

---

## PowerShell Test Example

```powershell id="jlwm6q"
Invoke-WebRequest `
  -Uri "http://localhost:8080" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"destinations":["Antigua Guatemala","Guatemala City","Mixco"],"mode":"open"}'
```

---

## Technologies Used

* Python
* Flask
* Functions Framework
* Google Maps Distance Matrix API
* Genetic Algorithm
