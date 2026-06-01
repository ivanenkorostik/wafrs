const API_URL = "/api";


export type VehicleCreate = {
    model: string;
    fuel_avg: number;
    fuel_city: number;
    fuel_type: string;
}
export type Vehicle = {
  id: number;
  user_id: number;
  model: string;
  fuel_avg: number;
  fuel_city: number;
  fuel_type: string;
};
export async function saveVehicle(payload: VehicleCreate, token: string){
    const response = await fetch(`${API_URL}/my-vehicles`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Не вдалося зберегти авто");
    }

    return data;
}
export async function getVehicles(token: string): Promise<Vehicle[]> {
  const response = await fetch(`${API_URL}/my-vehicles`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Не вдалося завантажити авто");
  }

  return data;
}