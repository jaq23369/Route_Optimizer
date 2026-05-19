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
