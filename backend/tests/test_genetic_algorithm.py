import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from genetic_algorithm import optimize_route
from mock_matrix import MOCK_MATRIX, MOCK_DESTINATIONS


# Verify the returned order contains all destination indices exactly once
def test_closed_route_returns_valid_order():
    order, distance = optimize_route(MOCK_MATRIX, "closed")
    assert sorted(order) == list(range(len(MOCK_DESTINATIONS)))
    assert distance > 0


# Verify open route also returns a valid permutation
def test_open_route_returns_valid_order():
    order, distance = optimize_route(MOCK_MATRIX, "open")
    assert sorted(order) == list(range(len(MOCK_DESTINATIONS)))
    assert distance > 0


# With only 2 destinations, closed route distance = A→B + B→A
def test_two_destinations_closed():
    matrix = [[0, 5000], [5000, 0]]
    order, distance = optimize_route(matrix, "closed")
    assert distance == 10000


# With only 2 destinations, open route distance = A→B only
def test_two_destinations_open():
    matrix = [[0, 5000], [5000, 0]]
    order, distance = optimize_route(matrix, "open")
    assert distance == 5000


# Closed route must always be longer than open route (adds the return leg)
def test_closed_route_longer_than_open():
    _, dist_closed = optimize_route(MOCK_MATRIX, "closed")
    _, dist_open = optimize_route(MOCK_MATRIX, "open")
    assert dist_closed > dist_open
