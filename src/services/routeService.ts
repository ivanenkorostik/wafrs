import type { RoutePoint, RouteResult } from "../types";
import { fetchOrsRoutes } from "./orsClient";
import { fetchOsrmRoutes } from "./osrmClient";
import { MAX_ROUTES_TO_SHOW, ORS_MAX_ALTERNATIVE_DISTANCE_KM, REQUESTED_ALTERNATIVES } from "./routeConfig";

export async function fetchRoutes(start: RoutePoint, end: RoutePoint, signal?: AbortSignal): Promise<RouteResult[]> {
  const points = [start, end] satisfies RoutePoint[];
  const osrmRoutes = await fetchOsrmRoutes(points, REQUESTED_ALTERNATIVES, signal);
  const mainRoute = osrmRoutes[0];

  if (!mainRoute || mainRoute.distanceKm >= ORS_MAX_ALTERNATIVE_DISTANCE_KM) {
    return osrmRoutes.slice(0, MAX_ROUTES_TO_SHOW);
  }

  const orsRoutes = await fetchOrsRoutes(points, MAX_ROUTES_TO_SHOW, signal);

  return orsRoutes.slice(0, MAX_ROUTES_TO_SHOW);
}

export async function fetchRoute(start: RoutePoint, end: RoutePoint, signal?: AbortSignal): Promise<RouteResult> {
  const routes = await fetchRoutes(start, end, signal);

  if (!routes[0]) {
    throw new Error("Маршрут між цими точками не знайдено.");
  }

  return routes[0];
}
