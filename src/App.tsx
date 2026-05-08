import './App.css'
import { useRef, useState } from "react";
import MapView from './components/MapView'
import Navbar from './components/navbar/navbar'
import RoutePanel from './components/routepanel/routepanel'
import Sidebar from './components/sidebar/sidebar'
import UserPanel from './components/user/userPanel'
import { fetchRoute } from './services/routeService'
import type { ActivePoint, RouteResult, SelectedRoutePoint } from './types'

function App() {
  const [startPoint, setStartPoint] = useState("");
  const [endPoint, setEndPoint] = useState("");
  const [isfuel, setisfuel] = useState(0);
  const [startMarker, setStartMarker] = useState<SelectedRoutePoint>(null);
  const [endMarker, setEndMarker] = useState<SelectedRoutePoint>(null);
  const [activePoint, setActivePoint] = useState<ActivePoint>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const routeRequestController = useRef<AbortController | null>(null);

  function clearRouteState() {
    routeRequestController.current?.abort();
    routeRequestController.current = null;
    setRoute(null);
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
      const nextRoute = await fetchRoute(startMarker, endMarker, controller.signal);
      setRoute(nextRoute);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      setRoute(null);
      setRouteError(error instanceof Error ? error.message : "Маршрут не знайдено.");
    } finally {
      if (routeRequestController.current === controller) {
        routeRequestController.current = null;
        setIsRouteLoading(false);
      }
    }
  }

  return (
    <main className='app'>
      <MapView
        startMarker={startMarker}
        endMarker={endMarker}
        routeCoordinates={route?.coordinates ?? null}
        onMapClick={handleMapClick}
      />
      <Navbar />
      <UserPanel />
      <RoutePanel
        startPoint={startPoint}
        endPoint={endPoint}
        activePoint={activePoint}
        fuel={isfuel} 
        routeSummary={route}
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
      />
      <Sidebar />
    </main>
  )
}

export default App
