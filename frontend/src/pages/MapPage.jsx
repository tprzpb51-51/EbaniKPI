import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { apiFetch } from '../api';

function getMyUserId() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1])).userId;
  } catch {
    return null;
  }
}

const FILTER_TYPES = [
  { value: 'всі', label: 'Усі' },
  { value: 'прогулянка', label: 'Прогулянка' },
  { value: 'настільні ігри', label: 'Настільні ігри' },
  { value: 'вечірка', label: 'Вечірка' },
  { value: 'інтерактиви', label: 'Інтерактиви' },
];

const userIcon = new L.DivIcon({
  html: `<div style="background:#D4F857;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px rgba(212,248,87,0.4)"></div>`,
  className: '',
  iconSize: [18, 18],
});

export default function MapPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [activeFilter, setActiveFilter] = useState('всі');
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [joiningId, setJoiningId] = useState(null);
  const [message, setMessage] = useState('');
  const myUserId = getMyUserId();

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Геолокація не підтримується вашим браузером');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        setLocationError('Дозвольте доступ до геолокації, щоб бачити події поруч');
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    if (userPos) {
      fetchEvents();
    }
  }, [userPos, activeFilter]);

  const fetchEvents = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      lat: userPos[0],
      lng: userPos[1],
      radius: 15,
    });
    if (activeFilter !== 'всі') params.append('type', activeFilter);

    const res = await apiFetch(`/api/events?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setEvents(data);
    setLoading(false);
  };

  const handleJoin = async (eventId) => {
    setJoiningId(eventId);
    const token = localStorage.getItem('token');
    const res = await apiFetch(`/api/events/${eventId}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setJoiningId(null);

    if (res.ok) {
      setMessage('Ви приєднались до події!');
      fetchEvents();
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage(data.error);
      setTimeout(() => setMessage(''), 3000);
    }
  };

 const createEventIcon = (avatarUrl) => {
  const inner = avatarUrl
    ? `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;transform:rotate(45deg)" />`
    : `<div style="width:100%;height:100%;background:#FF5A7A;border-radius:50%;transform:rotate(45deg);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:600">?</div>`;

  return new L.DivIcon({
    html: `<div style="width:36px;height:36px;background:white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #FF5A7A;box-shadow:0 2px 6px rgba(0,0,0,0.4);overflow:hidden;display:flex;align-items:center;justify-content:center;padding:2px">${inner}</div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
};

  return (
    <div className="h-screen bg-night flex flex-col">
      <div className="p-4 flex items-center gap-3">
        <button onClick={() => navigate('/menu')} className="text-white text-2xl">←</button>
        <h1 className="font-display text-xl font-bold text-white">Карта подій</h1>
      </div>

      <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
        {FILTER_TYPES.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
              activeFilter === f.value
                ? 'bg-coral text-white'
                : 'bg-nightLight text-gray-300 border border-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {message && (
        <div className="mx-4 mb-2 bg-lime text-night text-sm font-medium px-4 py-2 rounded-lg text-center">
          {message}
        </div>
      )}

      <div className="flex-1 relative">
        {locationError && (
          <div className="absolute inset-0 z-10 bg-night/95 flex items-center justify-center p-6">
            <p className="text-gray-300 text-center">{locationError}</p>
          </div>
        )}

        {loading && !locationError && (
          <div className="absolute inset-0 z-10 bg-night/70 flex items-center justify-center">
            <p className="text-white">Завантаження...</p>
          </div>
        )}

        {userPos && (
          <MapContainer center={userPos} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={userPos} icon={userIcon}>
              <Popup>Ви тут</Popup>
            </Marker>

            <Circle center={userPos} radius={15000} pathOptions={{ color: '#D4F857', fillOpacity: 0.03, weight: 1 }} />

            {events.map((event) => (
              <Marker key={event.id} position={[event.latitude, event.longitude]} icon={createEventIcon(event.organizer?.avatarUrl)}>
                <Popup>
                  <div className="text-night min-w-[180px]">
                    {event.organizer?.avatarUrl && (
  <img
    src={event.organizer.avatarUrl}
    alt=""
    className="w-10 h-10 rounded-full object-cover mb-2"
  />
)}
                    <p className="font-bold capitalize">{event.type}</p>

                    <p className="text-sm text-gray-600 mb-1">
                      Організатор: {event.organizer?.name}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      Вік: {event.ageMin}–{event.ageMax}
                    </p>
                    {event.distanceKm !== undefined && (
                      <p className="text-sm text-gray-600 mb-1">
                        {event.distanceKm.toFixed(1)} км від вас
                      </p>
                    )}
                    {event.comment && (
                      <p className="text-sm text-gray-700 mb-2">{event.comment}</p>
                    )}
                    {event.organizerId !== myUserId && (
                      <button
                        onClick={() => handleJoin(event.id)}
                        disabled={joiningId === event.id}
                        className="bg-coral text-white text-sm font-medium rounded-lg px-3 py-1.5 w-full disabled:opacity-50"
                      >
                        {joiningId === event.id ? 'Приєднання...' : 'Приєднатись'}
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}