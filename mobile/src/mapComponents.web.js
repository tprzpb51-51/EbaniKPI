import React from 'react';
import { MapContainer, TileLayer, Marker as LeafletMarker, Circle as LeafletCircle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#FF5A7A;border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,.3)"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

const ClickHandler = ({ onPress }) => {
  useMapEvents({
    click: (event) => onPress?.({
      nativeEvent: {
        coordinate: {
          latitude: event.latlng.lat,
          longitude: event.latlng.lng,
        },
      },
    }),
  });
  return null;
};

const Recenter = ({ region }) => {
  const map = useMap();

  React.useEffect(() => {
    map.flyTo([region.latitude, region.longitude], 16, { duration: 0.7 });
  }, [map, region.latitude, region.longitude]);

  return null;
};

const MapView = ({ children, style, region, onPress }) => (
  <MapContainer
    center={[region.latitude, region.longitude]}
    zoom={13}
    style={style}
    scrollWheelZoom
    zoomControl
    dragging
    doubleClickZoom
    touchZoom
    attributionControl
  >
    <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <Recenter region={region} />
    <ClickHandler onPress={onPress} />
    {children}
  </MapContainer>
);

const Circle = ({ center, radius }) => <LeafletCircle center={[center.latitude, center.longitude]} radius={radius} pathOptions={{ color: '#5B4BFF', fillOpacity: 0.08 }} />;
const Marker = ({ coordinate, onPress }) => (
  <LeafletMarker
    position={[coordinate.latitude, coordinate.longitude]}
    icon={markerIcon}
    eventHandlers={{ click: () => onPress?.() }}
    bubblingMouseEvents={false}
  />
);

export { Circle, Marker };
export default MapView;