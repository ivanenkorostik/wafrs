import type { RoutePoint, RouteResult } from "../types";
import { fetchOsrmRoutes } from "./osrmClient";
import { MAX_ROUTES_TO_SHOW, REQUESTED_ALTERNATIVES } from "./routeConfig";

export async function fetchRoutes(start: RoutePoint, end: RoutePoint, signal?: AbortSignal): Promise<RouteResult[]> {
  const routes = await fetchOsrmRoutes([start, end], REQUESTED_ALTERNATIVES, signal);

  return routes.slice(0, MAX_ROUTES_TO_SHOW);
}

export async function fetchRoute(start: RoutePoint, end: RoutePoint, signal?: AbortSignal): Promise<RouteResult> {
  const routes = await fetchRoutes(start, end, signal);

  if (!routes[0]) {
    throw new Error("Маршрут між цими точками не знайдено.");
  }

  return routes[0];
}
