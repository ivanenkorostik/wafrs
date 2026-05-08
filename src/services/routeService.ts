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

export async function fetchRoute(start: RoutePoint, end: RoutePoint, signal?: AbortSignal): Promise<RouteResult> {
  const coordinates = `${toOsrmCoordinate(start)};${toOsrmCoordinate(end)}`;
  const params = new URLSearchParams({
    overview: "full",
    geometries: "geojson",
  });

  const response = await fetch(`${OSRM_BASE_URL}/route/v1/driving/${coordinates}?${params}`, { signal });

  if (!response.ok) {
    throw new Error("Не вдалося отримати маршрут. Спробуйте ще раз.");
  }

  const data = (await response.json()) as OsrmRouteResponse;
  const route = data.routes?.[0];

  if (data.code !== "Ok" || !route) {
    throw new Error(data.message ?? "Маршрут між цими точками не знайдено.");
  }
  const distanceKm = route.distance / 1000;

  return {
    coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: distanceKm,
    durationMin: route.duration / 60,
  };
}
