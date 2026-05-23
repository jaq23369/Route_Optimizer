import os
from flask import jsonify
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import auth as firebase_auth

from genetic_algorithm import optimize_route
from distance_matrix import build_distance_matrix


load_dotenv()

ALLOWED_ORIGIN = os.environ.get(
    "ALLOWED_ORIGIN",
    "http://localhost:5173"
)

if not firebase_admin._apps:
    firebase_admin.initialize_app()


def _cors_headers():
    return {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }


def _json_error(message, status_code, headers):
    return jsonify({"error": message}), status_code, headers


def _verify_firebase_token(request):
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        raise PermissionError("Missing or invalid Authorization header")

    token = auth_header.removeprefix("Bearer ").strip()
    if not token:
        raise PermissionError("Missing Firebase token")

    try:
        return firebase_auth.verify_id_token(token, check_revoked=True)
    except Exception as exc:
        raise PermissionError("Invalid Firebase token") from exc


def optimize(request):

    headers = _cors_headers()

    if request.method == "OPTIONS":
        return ("", 204, headers)

    try:
        _verify_firebase_token(request)

        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return _json_error("Request body must be valid JSON", 400, headers)

        destinations = data.get("destinations")
        mode = data.get("mode")

        if not isinstance(destinations, list):
            return _json_error("destinations must be a list", 400, headers)

        if len(destinations) < 2 or len(destinations) > 15:
            return _json_error(
                "Destinations must contain between 2 and 15 places",
                400,
                headers,
            )

        if not all(isinstance(destination, str) and destination.strip() for destination in destinations):
            return _json_error("Each destination must be a non-empty string", 400, headers)

        if mode not in ("open", "closed"):
            return _json_error("mode must be 'open' or 'closed'", 400, headers)

        matrix = build_distance_matrix(destinations)
        order, total_distance = optimize_route(
            matrix,
            mode
        )

        route_details = [
            destinations[i]
            for i in order
        ]

        return jsonify({
            "order": order,
            "total_distance": total_distance,
            "route_details": route_details
        }), 200, headers

    except PermissionError as e:
        return _json_error(str(e), 401, headers)

    except ValueError as e:
        return _json_error(str(e), 400, headers)

    except Exception as e:
        return _json_error(str(e), 500, headers)
