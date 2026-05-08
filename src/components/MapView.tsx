import { divIcon } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMapEvents } from 'react-leaflet';

type MapViewProps = {
  startMarker: [number, number] | null;
  endMarker: [number, number] | null;
  onMapClick: (lat: number, lng: number) => void;
};

type MapClickHandlerProps = {
  onMapClick: (lat: number, lng: number) => void;
};

const startIcon = divIcon({
  className: "route-marker route-marker--start",
  html: "<span>A</span>",
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -36],
});

const endIcon = divIcon({
  className: "route-marker route-marker--end",
  html: "<span>B</span>",
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -36],
});

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

export default function MapView({ startMarker, endMarker, onMapClick }: MapViewProps) {
  const center: [number, number] = [49.4444, 32.0598]; // приблизно центр України / Черкаська область

  return (
    <div className="map-wrapper">
      <MapContainer
        center={center}
        zoom={7}
        zoomControl={false}
        scrollWheelZoom={true}
        className="map"
      >
        <ZoomControl position="bottomright" />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onMapClick={onMapClick} />

        {startMarker && (
          <Marker icon={startIcon} position={startMarker}>
            <Popup>Старт маршруту</Popup>
          </Marker>
        )}

        {endMarker && (
          <Marker icon={endIcon} position={endMarker}>
            <Popup>Фініш маршруту</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
