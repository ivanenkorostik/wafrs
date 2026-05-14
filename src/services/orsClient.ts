import type { RoutePoint, RouteResult } from "../types";
import { ORS_MAX_ALTERNATIVE_DISTANCE_KM } from "./routeConfig";

type OrsRouteFeature = {
  geometry: {
    coordinates: [number, number][];
  };
  properties: {
    summary: {
      distance: number;
      duration: number;
    };
  };
};

type OrsRouteResponse = {
  error?: {
    message?: string;
  };
  features?: OrsRouteFeature[];
};

const ORS_BASE_URL = "https://api.openrouteservice.org";
const ORS_API_KEY = import.meta.env.VITE_OPENROUTESERVICE_API_KEY;
const ORS_ALTERNATIVE_ROUTE_COUNT = 3;

class OrsHttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function toOrsCoordinate(point: RoutePoint) {
  const [lat, lng] = point;
  return [lng, lat];
}

function mapOrsRoute(feature: OrsRouteFeature): RouteResult {
  const { distance, duration } = feature.properties.summary;

  return {
    coordinates: feature.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: distance / 1000,
    durationMin: duration / 60,
  };
}

async function requestOrsRoutes(points: RoutePoint[], signal: AbortSignal | undefined, withAlternatives: boolean) {
  const response = await fetch(`${ORS_BASE_URL}/v2/directions/driving-car/geojson`, {
    method: "POST",
    signal,
    headers: {
      Accept: "application/json, application/geo+json",
      Authorization: ORS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coordinates: points.map(toOrsCoordinate),
      ...(withAlternatives
        ? {
            alternative_routes: {
              target_count: ORS_ALTERNATIVE_ROUTE_COUNT,
              weight_factor: 2,
              share_factor: 0.6,
            },
          }
        : {}),
    }),
  });

  if (!response.ok) {
    let message = "Не вдалося отримати маршрут через OpenRouteService. Спробуйте ще раз.";

    try {
      const data = (await response.json()) as OrsRouteResponse;

      if (data.error?.message) {
        message = data.error.message;
      }
    } catch {
      // ORS can return a non-JSON response for some HTTP errors.
    }

    throw new OrsHttpError(message, response.status);
  }

  const data = (await response.json()) as OrsRouteResponse;
  const route = data.features?.[0];

  if (!route) {
    throw new Error("Маршрут між цими точками не знайдено.");
  }

  return data.features?.map((feature) => mapOrsRoute(feature)) ?? [];
}

export async function fetchOrsRoutes(points: RoutePoint[], _targetRouteCount: number, signal?: AbortSignal) {
  if (!ORS_API_KEY) {
    throw new Error("Для OpenRouteService не знайдено VITE_OPENROUTESERVICE_API_KEY у .env.");
  }

  const mainRoutes = await requestOrsRoutes(points, signal, false);
  const mainRoute = mainRoutes[0];

  if (!mainRoute || mainRoute.distanceKm >= ORS_MAX_ALTERNATIVE_DISTANCE_KM) {
    return mainRoutes;
  }

  try {
    return await requestOrsRoutes(points, signal, true);
  } catch (error) {
    if (error instanceof OrsHttpError && error.status === 400) {
      return mainRoutes;
    }

    throw error;
  }
}
