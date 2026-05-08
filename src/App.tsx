import './App.css'
import { useState } from "react";
import MapView from './components/MapView'
import Navbar from './components/navbar/navbar'
import RoutePanel from './components/routepanel/routepanel'
import Sidebar from './components/sidebar/sidebar'
import UserPanel from './components/user/userPanel'


type ActivePoint = "start" | "end" | null;
type RoutePoint = [number, number] | null;

function App() {
  const [startPoint, setStartPoint] = useState("");
  const [endPoint, setEndPoint] = useState("");
  const [startMarker, setStartMarker] = useState<RoutePoint>(null);
  const [endMarker, setEndMarker] = useState<RoutePoint>(null);
  const [activePoint, setActivePoint] = useState<ActivePoint>(null);
  
  function handleMapClick(lat: number, lng: number) {
    const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    if (activePoint === "start") {
      setStartPoint(coords);
      setStartMarker([lat, lng]);
    }

    if (activePoint === "end") {
      setEndPoint(coords);
      setEndMarker([lat, lng]);
    }
  }

  return (
    <main className='app'>
      <MapView
        startMarker={startMarker}
        endMarker={endMarker}
        onMapClick={handleMapClick}
      />
      <Navbar />
      <UserPanel />
      <RoutePanel startPoint={startPoint}
        endPoint={endPoint}
        activePoint={activePoint}
        setStartPoint={setStartPoint}
        setEndPoint={setEndPoint}
        setActivePoint={setActivePoint}/>
      
      
      <Sidebar />
      
      
    </main>
  )
}

export default App
