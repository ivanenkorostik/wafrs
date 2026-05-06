import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

export default function MapView() {
  const center: [number, number] = [49.4444, 32.0598]; // приблизно центр України / Черкаська область

  return (
    <div className="map-wrapper">
      <MapContainer
        center={center}
        zoom={7}
        scrollWheelZoom={true}
        className="map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={center}>
          <Popup>
            Початкова точка карти
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}