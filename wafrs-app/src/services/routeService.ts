import type { RoutePoint, RouteResult } from "../types";
import { fetchOrsRoutes } from "./orsClient";
import { fetchOsrmRoutes } from "./osrmClient";
import { MAX_ROUTES_TO_SHOW, ORS_MAX_ALTERNATIVE_DISTANCE_KM, REQUESTED_ALTERNATIVES } from "./routeConfig";

export async function fetchRoutes(start: RoutePoint, end: RoutePoint, signal?: AbortSignal): Promise<RouteResult[]> {
  const routePoints: RoutePoint[] = [start, end];
  const osrmRoutes = await fetchOsrmRoutes(routePoints, REQUESTED_ALTERNATIVES, signal);

  if (osrmRoutes.length === 0) {
    return [];
  }

  const mainRoute = osrmRoutes[0];

  if (mainRoute.distanceKm >= ORS_MAX_ALTERNATIVE_DISTANCE_KM) {
    return osrmRoutes.slice(0, MAX_ROUTES_TO_SHOW);
  }

  try {
    const orsRoutes = await fetchOrsRoutes(routePoints, MAX_ROUTES_TO_SHOW, signal);
    return orsRoutes.slice(0, MAX_ROUTES_TO_SHOW);
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    return osrmRoutes.slice(0, MAX_ROUTES_TO_SHOW);
  }
}

export async function fetchRoute(start: RoutePoint, end: RoutePoint, signal?: AbortSignal): Promise<RouteResult> {
  const routes = await fetchRoutes(start, end, signal);

  if (!routes[0]) {
    throw new Error("Маршрут між цими точками не знайдено.");
  }

  return routes[0];
}
