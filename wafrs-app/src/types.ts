export type ActivePoint = "start" | "end" | null;

export type RoutePoint = [number, number];

export type SelectedRoutePoint = RoutePoint | null;

export type RouteSummary = {
  distanceKm: number;
  durationMin: number;

};
export type GeocodedPlace = {
  id: string;
  label: string;
  point: RoutePoint;
  
  address: {
    name?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    district?: string;
    county?: string;
    state?: string;
    country?: string;
    
  };
};
export type SavedRoute = {
  id: number;
  start_location: string;
  finish_location: string;
  distance: string;
  duration: string;
  fuel: string;
  saved_at: string;
  user_id: number;
};

export type RouteResult = RouteSummary & {
  coordinates: RoutePoint[];
};
