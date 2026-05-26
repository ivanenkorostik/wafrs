import './App.css'
import { useRef, useState } from "react";
import MapView from './components/MapView'
import Navbar from './components/navbar/navbar'
import RoutePanel from './components/routepanel/routepanel'
import Sidebar from './components/sidebar/sidebar'
import UserPanel from './components/user/userPanel'
import { fetchRoutes } from './services/routeService'
import type { ActivePoint, RouteResult, SelectedRoutePoint } from './types'
import Modal from './components/modal';
import type { Vehicle } from './api/mycar-api';

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
      setStartMarker([lat, lng]);
    }

    if (activePoint === "end") {
      setEndPoint(coords);
      setEndMarker([lat, lng]);
    }
  }

  function handleStartPointChange(value: string) {
    setStartPoint(value);
    setStartMarker(null);
    clearRouteState();
  }

  function handleEndPointChange(value: string) {
    setEndPoint(value);
    setEndMarker(null);
    clearRouteState();
  }

  function clearStartPoint() {
    setStartPoint("");
    setStartMarker(null);
    clearRouteState();
  }

  function clearEndPoint() {
    setEndPoint("");
    setEndMarker(null);
    clearRouteState();
  }

  function clearRoutePoints() {
    setStartPoint("");
    setEndPoint("");
    setStartMarker(null);
    setEndMarker(null);
    setActivePoint(null);
    clearRouteState();
  }
  function calculateFuel(value: number) {
    setisfuel(value);
  }
  function handleFuelTypeChange(value: string) {
  setfueltype(value);
}
const closeModal = () => {
  setIsModalOpen(false);
};
const openModal = () => {
  setIsModalOpen(true);
};

  async function createRoute() {
    if (!startMarker || !endMarker) {
      setRouteError("Оберіть старт і фініш на карті.");
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
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      setRoutes([]);
      setActiveRouteIndex(0);
      setRouteError(error instanceof Error ? error.message : "Маршрут не знайдено.");
    } finally {
      if (routeRequestController.current === controller) {
        routeRequestController.current = null;
        setIsRouteLoading(false);
      }
    }
     
  }
  const averageSpeed = activeRoute
    ? activeRoute.distanceKm / (activeRoute.durationMin / 60)
    : 0;

  let selectedVehicleFuel = isfuel;
  let fuelMode: string | null = null;

  if (selectedVehicle) {
    const cityConsumption = selectedVehicle.fuel_city;
    const cruiseConsumption = selectedVehicle.fuel_avg;

    if (!activeRoute) {
      selectedVehicleFuel = cruiseConsumption;
    } else if (averageSpeed <= 35) {
      selectedVehicleFuel = cityConsumption;
      fuelMode = "Місто";
    } else if (averageSpeed <= 65) {
      selectedVehicleFuel = cityConsumption * 0.4 + cruiseConsumption * 0.6;
      fuelMode = "Змішаний";
    } else if (averageSpeed <= 90) {
      selectedVehicleFuel = cruiseConsumption;
      fuelMode = "Траса";
    } else {
      selectedVehicleFuel = cruiseConsumption * 1.15;
      fuelMode = "Висока швидкість";
    }
  }

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
        routeSummary={activeRoute}
        routeError={routeError}
        isRouteLoading={isRouteLoading}
        canCreateRoute={Boolean(startMarker && endMarker)}
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
