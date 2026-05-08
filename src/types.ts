export type ActivePoint = "start" | "end" | null;

export type RoutePoint = [number, number];

export type SelectedRoutePoint = RoutePoint | null;

export type RouteSummary = {
  distanceKm: number;
  durationMin: number;

};

export type RouteResult = RouteSummary & {
  coordinates: RoutePoint[];
};
