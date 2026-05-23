import os
import sys

from flask import Flask, request


sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import main


app = Flask(__name__)


def test_options_allows_authorization_header():
    with app.test_request_context("/", method="OPTIONS"):
        response = main.optimize(request)

    assert response[1] == 204
    assert "Authorization" in response[2]["Access-Control-Allow-Headers"]


def test_post_without_token_returns_401():
    with app.test_request_context(
        "/",
        method="POST",
        json={"destinations": ["A", "B"], "mode": "open"},
    ):
        response = main.optimize(request)

    assert response[1] == 401
    assert response[0].get_json()["error"] == "Missing or invalid Authorization header"


def test_valid_request_returns_optimized_route(monkeypatch):
    monkeypatch.setattr(main, "_verify_firebase_token", lambda req: {"uid": "test-user"})
    monkeypatch.setattr(main, "build_distance_matrix", lambda destinations: [[0, 10], [10, 0]])
    monkeypatch.setattr(main, "optimize_route", lambda matrix, mode: ([1, 0], 10))

    with app.test_request_context(
        "/",
        method="POST",
        headers={"Authorization": "Bearer valid-token"},
        json={"destinations": ["A", "B"], "mode": "open"},
    ):
        response = main.optimize(request)

    assert response[1] == 200
    assert response[0].get_json() == {
        "order": [1, 0],
        "total_distance": 10,
        "route_details": ["B", "A"],
    }
