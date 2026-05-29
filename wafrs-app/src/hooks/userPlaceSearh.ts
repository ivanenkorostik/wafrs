import { useEffect, useState } from "react";
import type { GeocodedPlace } from "../types";
import { searchPlace } from "../services/geocoding";

export function usePlaceSearch(query: string, selectedPlace: GeocodedPlace | null) {
  const [suggestions, setSuggestions] = useState<GeocodedPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPlace || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const places = await searchPlace(query, controller.signal);
        setSuggestions(places);
      } catch (searchError) {
        if (!controller.signal.aborted) {
          setError(searchError instanceof Error ? searchError.message : "Помилка пошуку.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, selectedPlace]);

  return {
    suggestions,
    setSuggestions,
    isLoading,
    error,
    setError,
  };
}