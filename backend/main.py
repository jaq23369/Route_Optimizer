import os
from flask import jsonify

from genetic_algorithm import optimize_route
from distance_matrix import build_distance_matrix


ALLOWED_ORIGIN = os.environ.get(
    "ALLOWED_ORIGIN",
    "http://localhost:5173"
)


def optimize(request):

    headers = {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if request.method == "OPTIONS":
        return ("", 204, headers)

    try:
        data = request.get_json()

        destinations = data.get("destinations")
        mode = data.get("mode")

        if not isinstance(destinations, list):
            return jsonify({
                "error": "destinations must be a list"
            }), 400, headers

        if len(destinations) < 2 or len(destinations) > 15:
            return jsonify({
                "error": "Destinations must contain between 2 and 15 places"
            }), 400, headers

        if mode not in ("open", "closed"):
            return jsonify({
                "error": "mode must be 'open' or 'closed'"
            }), 400, headers

        matrix = build_distance_matrix(destinations)

        order, total_distance = optimize_route(matrix, mode)

        route_details = [destinations[i] for i in order]

        return jsonify({
            "order": order,
            "total_distance": total_distance,
            "route_details": route_details
        }), 200, headers

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500, headers