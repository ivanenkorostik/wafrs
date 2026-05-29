import type { GeocodedPlace } from "../types";

type NominatimAddress = {
    city?: string;
    town?:string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
}


type NominatimPlace = {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address?:  NominatimAddress;
};

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

export async function searchPlace(query: string, signal?: AbortSignal): Promise<GeocodedPlace []> {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
    return [];
    }
    const params = new URLSearchParams({
        q: trimmedQuery,
        format: "jsonv2",
        limit: "5",
        addressdetails: "1",
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, { signal });
    
    if (!response.ok) {
        throw new Error("Не вдалося знайти місто.")
    }
    const data = (await response.json()) as NominatimPlace[];
    return data.map((place) => ({
        id: place.place_id.toString(),
        label: place.display_name,
        point: [Number(place.lat), Number(place.lon)],
        address: {
            city: place.address?.city,
            town: place.address?.town,
            village: place.address?.village,
            municipality: place.address?.municipality,
            county: place.address?.county,
            state: place.address?.state,
            country: place.address?.country
        }
    }));
}