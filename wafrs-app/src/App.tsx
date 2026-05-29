import './App.css'
import { useRef, useState } from "react";
import MapView from './components/MapView'
import Navbar from './components/navbar/Navbar'
import RoutePanel from './components/routepanel/Routepanel'
import Sidebar from './components/sidebar/Sidebar'
import UserPanel from './components/user/UserPanel'
import { fetchRoutes } from './services/routeService'
import type { ActivePoint, GeocodedPlace, RouteResult, SelectedRoutePoint } from './types'
import Modal from './components/vechicle/Vechicle-modal';
import type { Vehicle } from './api/mycar-api';
import { usePlaceSearch } from './hooks/userPlaceSearh';
import { getVehicleFuelUsage } from "./utils/fuel";

function App() {
  const [startPoint, setStartPoint] = useState("");
  const [endPoint, setEndPoint] = useState("");
  const [isfuel, setisfuel] = useState(0);
  const [fueltype, setfueltype] = useState("92");
  const [startMarker, setStartMarker] = useState<SelectedRoutePoint>(null);
  const [endMarker, setEndMarker] = useState<SelectedRoutePoint>(null);
  const [activePoint, setActivePoint] = useState<ActivePoint>(null);
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const routeRequestController = useRef<AbortController | null>(null);
  const activeRoute = routes[activeRouteIndex] ?? null;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [startPlace, setStartPlace] = useState<GeocodedPlace | null>(null);
  const [endPlace, setEndPlace] = useState<GeocodedPlace | null>(null);
  const {
  suggestions: startSuggestions,
  setSuggestions: setStartSuggestions,
  isLoading: isStartSearchLoading,
  error: startSearchError,
  setError: setStartSearchError,
} = usePlaceSearch(startPoint, startPlace);

const {
  suggestions: endSuggestions,
  setSuggestions: setEndSuggestions,
  isLoading: isEndSearchLoading,
  error: endSearchError,
  setError: setEndSearchError,
} = usePlaceSearch(endPoint, endPlace);

function clearRouteState() {
    routeRequestController.current?.abort();
    routeRequestController.current = null;
    setRoutes([]);
    setActiveRouteIndex(0);
    setRouteError(null);
    setIsRouteLoading(false);
  }
  
  function handleMapClick(lat: number, lng: number) {
    if (!activePoint) {
      return;
    }

    const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    clearRouteState();

    if (activePoint === "start") {
      setStartPoint(coords);
      setStartPlace(null);
      setStartSuggestions([]);
      setStartMarker([lat, lng]);
    }

    if (activePoint === "end") {
      setEndPoint(coords);
      setEndPlace(null);
      setEndSuggestions([]);
      setEndMarker([lat, lng]);
    }
  }

  function handleStartPointChange(value: string) {
    setStartPoint(value);
    setStartPlace(null);
    setStartMarker(null);
    clearRouteState();
  }

  function handleEndPointChange(value: string) {
    setEndPoint(value);
    setEndPlace(null);
    setEndMarker(null);
    clearRouteState();
  }

  function clearStartPoint() {
    setStartPoint("");
    setStartMarker(null);
    clearRouteState();
    setStartPlace(null);
    setStartSuggestions([]);
    setStartSearchError(null);
  }

  function clearEndPoint() {
    setEndPoint("");
    setEndMarker(null);
    clearRouteState();
    setEndPlace(null);
    setEndSuggestions([]);
    setEndSearchError(null);
  }

  function clearRoutePoints() {
    setStartPoint("");
    setEndPoint("");
    setStartMarker(null);
    setEndMarker(null);
    setActivePoint(null);
    clearRouteState();
    setStartPlace(null);
    setEndPlace(null);
    setStartSuggestions([]);
    setEndSuggestions([]);
    setStartSearchError(null);
    setEndSearchError(null);
    setActivePoint(null);
    clearRouteState();
  }
  function calculateFuel(value: number) {
    setisfuel(value);
  }
  function handleFuelTypeChange(value: string) {
  setfueltype(value);
  }
  function selectStartPlace(place: GeocodedPlace) {
    clearRouteState();
    setStartPlace(place);
    setStartPoint(place.label);
    setStartMarker(place.point);
    setStartSuggestions([]);
  }
  function selectEndPlace(place: GeocodedPlace) {
    clearRouteState();
    setEndPlace(place);
    setEndPoint(place.label);
    setEndMarker(place.point);
    setEndSuggestions([]);
  }

const closeModal = () => {
  setIsModalOpen(false);
};
const openModal = () => {
  setIsModalOpen(true);
};

  

  async function createRoute() {
    if (!startMarker  || !endMarker) {
      setRouteError("Оберіть конкретний старт і фініш зі списку або на карті.");
      return;
    }

    setIsRouteLoading(true);
    setRouteError(null);
    routeRequestController.current?.abort();

    const controller = new AbortController();
    routeRequestController.current = controller;

    try {
      const nextRoutes = await fetchRoutes(startMarker, endMarker, controller.signal);
      setRoutes(nextRoutes);
      setActiveRouteIndex(0);
    }catch (error) {
    if (controller.signal.aborted) {
      return;
    }
    setRoutes([]);
    setActiveRouteIndex(0);
    setRouteError(error instanceof Error ? error.message : "Маршрут не знайдено.");}
    finally {
      if (routeRequestController.current === controller) {
      routeRequestController.current = null;
      setIsRouteLoading(false);
        }
      }
    }

  const {
      fuel: selectedVehicleFuel,
      fuelMode,
    } = getVehicleFuelUsage(selectedVehicle, activeRoute,isfuel);
  

  return (
    <main className='app'>
      <MapView
        startMarker={startMarker}
        endMarker={endMarker}
        routes={routes}
        activeRouteIndex={activeRouteIndex}
        onSelectRoute={setActiveRouteIndex}
        onMapClick={handleMapClick}
      />
      <Navbar />
      <UserPanel />
      <RoutePanel
        startPoint={startPoint}
        endPoint={endPoint}
        activePoint={activePoint}
        fuel={selectedVehicleFuel}
        fueltype={selectedVehicle ? selectedVehicle.fuel_type : fueltype}
        routes={routes}
        activeRouteIndex={activeRouteIndex}
        routeError={routeError}
        isRouteLoading={isRouteLoading}
        canCreateRoute={Boolean(startMarker && endMarker)}
        startSuggestions={startSuggestions}
        endSuggestions={endSuggestions}
        routeSummary={activeRoute}
        isStartSearchLoading={isStartSearchLoading}
        isEndSearchLoading={isEndSearchLoading}
        startSearchError={startSearchError}
        endSearchError={endSearchError}
        onSelectStartPlace={selectStartPlace}
        onSelectEndPlace={selectEndPlace}
        onStartPointChange={handleStartPointChange}
        onEndPointChange={handleEndPointChange}
        setActivePoint={setActivePoint}
        onClearStart={clearStartPoint}
        onClearEnd={clearEndPoint}
        onClearAll={clearRoutePoints}
        onCreateRoute={createRoute}
        onCalculateFuel={calculateFuel}
        onSelectRoute={setActiveRouteIndex}
        onFuelTypeChange={handleFuelTypeChange}
        onOpenModal={openModal}
        selectedVehicleModel={selectedVehicle?.model ?? null}
        fuelMode={fuelMode}
      />
      {isModalOpen && <Modal onClose={closeModal} onSelectVehicle={setSelectedVehicle}
      />}
      <Sidebar />
    </main>
  )
}

export default App
