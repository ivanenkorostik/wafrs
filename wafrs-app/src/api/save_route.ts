import type { SavedRoute } from "../types";

const API_URL = "/api";

export type SavedRoutePayload = {
  start_location: string;
  finish_location: string;
  distance: string;
  duration: string;
  fuel: string;
};

export async function getSavedRoutes(token: string): Promise<SavedRoute[]> {
  const response = await fetch(`${API_URL}/saved-routes`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Не вдалося завантажити збережені маршрути");
  }

  return data;
}

export async function saveRoute(
  payload: SavedRoutePayload,
  token: string
): Promise<SavedRoute> {
  const response = await fetch(`${API_URL}/saved-routes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Не вдалося зберегти маршрут");
  }

  return data;
}

export async function deleteSavedRoute(id: number, token: string) {
  const response = await fetch(`${API_URL}/saved-routes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Не вдалося видалити маршрут");
  }

  return data;
}