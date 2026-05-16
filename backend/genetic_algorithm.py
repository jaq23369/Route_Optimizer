import random

# Genetic algorithm hyperparameters
POPULATION_SIZE = 100
MAX_GENERATIONS = 500
TOURNAMENT_SIZE = 5
CROSSOVER_RATE = 0.8
MUTATION_RATE = 0.02
CONVERGENCE_PATIENCE = 50  # stop if no improvement after this many generations


# Calculates the total distance of a route given the distance matrix and mode
def _route_distance(route: list[int], matrix: list[list[float]], mode: str) -> float:
    total = sum(matrix[route[i]][route[i + 1]] for i in range(len(route) - 1))
    # Closed route returns to the starting point
    if mode == "closed":
        total += matrix[route[-1]][route[0]]
    return total


# Selects the best individual from a random subset of the population (tournament)
def _tournament_select(population: list[list[int]], matrix: list[list[float]], mode: str) -> list[int]:
    candidates = random.sample(population, TOURNAMENT_SIZE)
    return min(candidates, key=lambda r: _route_distance(r, matrix, mode))


# Order Crossover (OX): preserves relative order of genes from both parents
def _order_crossover(parent1: list[int], parent2: list[int]) -> list[int]:
    n = len(parent1)
    a, b = sorted(random.sample(range(n), 2))

    # Copy a segment from parent1 into the child
    child = [-1] * n
    child[a:b + 1] = parent1[a:b + 1]

    # Fill remaining positions with genes from parent2 in order
    fill = [x for x in parent2 if x not in child]
    idx = 0
    for i in range(n):
        if child[i] == -1:
            child[i] = fill[idx]
            idx += 1

    return child


# Swap mutation: randomly swaps two destinations in the route
def _swap_mutation(route: list[int]) -> list[int]:
    route = route[:]
    i, j = random.sample(range(len(route)), 2)
    route[i], route[j] = route[j], route[i]
    return route


# Main function: runs the genetic algorithm and returns the optimal route order and total distance
def optimize_route(distance_matrix: list[list[float]], mode: str) -> tuple[list[int], float]:
    n = len(distance_matrix)

    if n < 2:
        raise ValueError("Se necesitan al menos 2 destinos.")

    # Edge case: only 2 destinations, no optimization needed
    if n == 2:
        route = [0, 1]
        return route, _route_distance(route, distance_matrix, mode)

    # Initialize population with random permutations of destination indices
    population = [random.sample(range(n), n) for _ in range(POPULATION_SIZE)]

    best_route = min(population, key=lambda r: _route_distance(r, distance_matrix, mode))
    best_distance = _route_distance(best_route, distance_matrix, mode)
    generations_without_improvement = 0

    for _ in range(MAX_GENERATIONS):
        new_population = []

        for _ in range(POPULATION_SIZE):
            parent1 = _tournament_select(population, distance_matrix, mode)
            parent2 = _tournament_select(population, distance_matrix, mode)

            # Apply crossover or clone parent1
            child = _order_crossover(parent1, parent2) if random.random() < CROSSOVER_RATE else parent1[:]

            # Apply mutation randomly
            if random.random() < MUTATION_RATE:
                child = _swap_mutation(child)

            new_population.append(child)

        population = new_population

        # Track the best solution found so far
        current_best = min(population, key=lambda r: _route_distance(r, distance_matrix, mode))
        current_distance = _route_distance(current_best, distance_matrix, mode)

        if current_distance < best_distance:
            best_route = current_best
            best_distance = current_distance
            generations_without_improvement = 0
        else:
            generations_without_improvement += 1

        # Early stopping if the population has converged
        if generations_without_improvement >= CONVERGENCE_PATIENCE:
            break

    return best_route, best_distance
