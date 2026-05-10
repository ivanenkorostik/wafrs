import type { RoutePoint, RouteResult } from "../types";

type OsrmRoute = {
  distance: number;
  duration: number;

  geometry: {
    coordinates: [number, number][];
  };
};

type OsrmRouteResponse = {
  code: string;
  message?: string;
  routes?: OsrmRoute[];
};

const OSRM_BASE_URL = import.meta.env.VITE_OSRM_BASE_URL ?? "https://router.project-osrm.org";

function toOsrmCoordinate(point: RoutePoint) {
  const [lat, lng] = point;
  return `${lng},${lat}`;
}

function mapOsrmRoute(route: OsrmRoute): RouteResult {
  const distanceKm = route.distance / 1000;

  return {
    coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: distanceKm,
    durationMin: route.duration / 60,
  };
}

export async function fetchOsrmRoutes(points: RoutePoint[], alternatives: string, signal?: AbortSignal) {
  const coordinates = points.map(toOsrmCoordinate).join(";");
  const params = new URLSearchParams({
    alternatives,
    overview: "full",
    geometries: "geojson",
  });

  const response = await fetch(`${OSRM_BASE_URL}/route/v1/driving/${coordinates}?${params}`, { signal });

  if (!response.ok) {
    let message = "Не вдалося отримати маршрут. Спробуйте ще раз.";

    try {
      const data = (await response.json()) as OsrmRouteResponse;

      if (data.message) {
        message = data.message;
      }
    } catch {
      // OSRM sometimes returns a plain HTTP error without JSON details.
    }

    throw new Error(message);
  }

  const data = (await response.json()) as OsrmRouteResponse;
  const route = data.routes?.[0];

  if (data.code !== "Ok" || !route) {
    throw new Error(data.message ?? "Маршрут між цими точками не знайдено.");
  }

  return data.routes?.map((route) => mapOsrmRoute(route)) ?? [];
}
