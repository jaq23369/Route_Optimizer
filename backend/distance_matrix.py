import os
import googlemaps
from dotenv import load_dotenv

load_dotenv()

# Maximum allowed distance between any two destinations (100 km in meters)
MAX_DISTANCE_METERS = 100_000


# Builds an NxN distance matrix (in meters) using Google Maps Distance Matrix API
# Raises ValueError if any pair of destinations exceeds 100 km
def build_distance_matrix(destinations: list[str]) -> list[list[float]]:
    client = googlemaps.Client(key=os.environ["GOOGLE_MAPS_API_KEY"])

    # Request driving distances between all origin-destination pairs at once
    result = client.distance_matrix(
        origins=destinations,
        destinations=destinations,
        mode="driving",
        units="metric",
    )

    n = len(destinations)
    matrix = [[0.0] * n for _ in range(n)]

    for i, row in enumerate(result["rows"]):
        for j, element in enumerate(row["elements"]):
            # API returns "OK" only when a valid route was found
            if element["status"] != "OK":
                raise ValueError(
                    f"No se pudo calcular la distancia entre "
                    f"'{destinations[i]}' y '{destinations[j]}'."
                )

            distance = element["distance"]["value"]  # value is in meters

            # Validate 100 km radius constraint between every pair
            if i != j and distance > MAX_DISTANCE_METERS:
                raise ValueError(
                    f"La distancia entre '{destinations[i]}' y '{destinations[j]}' "
                    f"({distance / 1000:.1f} km) supera el límite de 100 km."
                )

            matrix[i][j] = float(distance)

    return matrix
