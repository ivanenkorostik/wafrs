import type { RouteSummary } from "../types";
import type { Vehicle } from "../api/mycar-api";

export const FUEL_PRICES: Record<string, number> = {
  "92": 66.39,
  "95": 73,
  diesel: 88,
  lpg: 48,
};

export function getAverageSpeed(route: RouteSummary | null) {
  return route ? route.distanceKm / (route.durationMin / 60) : 0;
}

export function getVehicleFuelUsage(vehicle: Vehicle | null, route: RouteSummary | null, fallbackFuel: number) {
  if (!vehicle) {
    return {
      fuel: fallbackFuel,
      fuelMode: null,
    };
  }

  const averageSpeed = getAverageSpeed(route);
  const cityConsumption = vehicle.fuel_city;
  const cruiseConsumption = vehicle.fuel_avg;

  if (!route) {
    return {
      fuel: cruiseConsumption,
      fuelMode: null,
    };
  }

  if (averageSpeed <= 35) {
    return {
      fuel: cityConsumption,
      fuelMode: "Місто",
    };
  }

  if (averageSpeed <= 65) {
    return {
      fuel: cityConsumption * 0.4 + cruiseConsumption * 0.6,
      fuelMode: "Змішаний",
    };
  }

  if (averageSpeed <= 90) {
    return {
      fuel: cruiseConsumption,
      fuelMode: "Траса",
    };
  }

  return {
    fuel: cruiseConsumption * 1.15,
    fuelMode: "Висока швидкість",
  };
}

export function calculateFuelUsed(distanceKm: number, fuel: number) {
  return (distanceKm * fuel) / 100;
}

export function calculateFuelCost(fuelUsed: number, fuelType: string) {
  return fuelUsed * (FUEL_PRICES[fuelType] ?? 0);
}