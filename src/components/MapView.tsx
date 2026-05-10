import { useEffect } from 'react';
import { divIcon } from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import type { RouteResult, SelectedRoutePoint } from '../types';

type MapViewProps = {
  startMarker: SelectedRoutePoint;
  endMarker: SelectedRoutePoint;
  routes: RouteResult[];
  activeRouteIndex: number;
  onSelectRoute: (index: number) => void;
  onMapClick: (lat: number, lng: number) => void;
};

type MapClickHandlerProps = {
  onMapClick: (lat: number, lng: number) => void;
};

type FitBoundsToRoutePointsProps = {
  startMarker: SelectedRoutePoint;
  endMarker: SelectedRoutePoint;
  activeRoute: RouteResult | null;
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

function FitBoundsToRoutePoints({ startMarker, endMarker, activeRoute }: FitBoundsToRoutePointsProps) {
  const map = useMap();

  useEffect(() => {
    if (!startMarker || !endMarker) {
      return;
    }

    const boundsPoints = activeRoute && activeRoute.coordinates.length > 1
      ? activeRoute.coordinates
      : [startMarker, endMarker];

    map.fitBounds(boundsPoints, {
      padding: [48, 48],
      maxZoom: 14,
    });
  }, [activeRoute, endMarker, map, startMarker]);

  return null;
}

export default function MapView({
  startMarker,
  endMarker,
  routes,
  activeRouteIndex,
  onSelectRoute,
  onMapClick,
}: MapViewProps) {
  const center: [number, number] = [49.4444, 32.0598]; // приблизно центр України / Черкаська область
  const activeRoute = routes[activeRouteIndex] ?? null;

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
        <FitBoundsToRoutePoints
          startMarker={startMarker}
          endMarker={endMarker}
          activeRoute={activeRoute}
        />

        {routes.map((route, index) => (
          index !== activeRouteIndex && (
            <Polyline
              key={`${index}-${route.distanceKm}-${route.durationMin}`}
              positions={route.coordinates}
              pathOptions={{
                color: "rgb(14, 165, 233)",
                opacity: 0.38,
                weight: 4,
              }}
              eventHandlers={{
                click: () => onSelectRoute(index),
              }}
            />
          )
        ))}

        {activeRoute && (
          <Polyline
            positions={activeRoute.coordinates}
            pathOptions={{
              color: "rgb(37, 99, 235)",
              opacity: 0.92,
              weight: 6,
            }}
          />
        )}

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
