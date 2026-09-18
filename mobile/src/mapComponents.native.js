import React, { useMemo } from 'react';
import { WebView } from 'react-native-webview';

const escapeHtml = (value) => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#039;');

const getChildProps = (children) => React.Children.toArray(children)
	.map((child) => child?.props)
	.filter(Boolean);

const buildMapHtml = ({ region, children }) => {
	const childProps = getChildProps(children);
	const circle = childProps.find((props) => props.radius);
	const markers = childProps.filter((props) => props.coordinate).map((props, index) => ({
		id: index,
		latitude: Number(props.coordinate.latitude),
		longitude: Number(props.coordinate.longitude),
		title: escapeHtml(props.title || ''),
		description: escapeHtml(props.description || ''),
	})).filter((marker) => Number.isFinite(marker.latitude) && Number.isFinite(marker.longitude));
	const markerScript = markers.map((marker) => {
		const popup = marker.title || marker.description
			? JSON.stringify(`${marker.title}${marker.description ? `<br>${marker.description}` : ''}`)
			: null;
		return `
		const marker${marker.id} = L.marker([${marker.latitude}, ${marker.longitude}], { icon: L.divIcon({ className: 'event-marker', html: '<span></span>', iconSize: [24, 24], iconAnchor: [12, 24] }) }).addTo(map);
		marker${marker.id}.on('click', (event) => { L.DomEvent.stopPropagation(event); window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker', id: ${marker.id} })); });
		${popup ? `marker${marker.id}.bindPopup(${popup});` : ''}
	`;
	}).join('\n');
	const circleLatitude = Number(circle?.center?.latitude ?? region.latitude);
	const circleLongitude = Number(circle?.center?.longitude ?? region.longitude);
	const circleScript = circle ? `L.circle([${circleLatitude}, ${circleLongitude}], { radius: ${Number(circle.radius) || 15000}, color: '#5B4BFF', fillColor: '#5B4BFF', fillOpacity: 0.08 }).addTo(map);` : '';

	return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{height:100%;margin:0;background:#17172A}.event-marker{background:transparent;border:0}.event-marker span{display:block;width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#FF5A7A;border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,.3)}.leaflet-control-attribution{font-size:9px}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
	const map = L.map('map', { zoomControl: true }).setView([${Number(region.latitude)}, ${Number(region.longitude)}], 13);
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
	map.on('click', (event) => window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map', latitude: event.latlng.lat, longitude: event.latlng.lng })));
	${circleScript}
	${markerScript}
</script></body></html>`;
};

const MapView = ({ children, style, region, onPress }) => {
	const html = useMemo(() => buildMapHtml({ region, children }), [region.latitude, region.longitude, children]);

	const handleMessage = (event) => {
		try {
			const message = JSON.parse(event.nativeEvent.data);
			if (message.type === 'map') {
				onPress?.({ nativeEvent: { coordinate: { latitude: message.latitude, longitude: message.longitude } } });
			}
			if (message.type === 'marker') {
				const marker = React.Children.toArray(children).filter((child) => child?.props?.coordinate)[message.id];
				marker?.props?.onPress?.();
			}
		} catch (error) {
			return null;
		}
		return null;
	};

	return <WebView originWhitelist={['*']} source={{ html }} style={style} onMessage={handleMessage} javaScriptEnabled domStorageEnabled setSupportMultipleWindows={false} />;
};

const Circle = ({ center, radius, fillColor, strokeColor }) => null;
const Marker = ({ coordinate, onPress, title, description, children }) => null;

export { Circle, Marker };
export default MapView;