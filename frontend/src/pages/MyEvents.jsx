import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  CircleAlert,
  Film,
  Footprints,
  Gamepad2,
  MapPin,
  Martini,
  MessageCircle,
  Plus,
  Sparkles,
  XCircle
} from 'lucide-react';

const eventThemes = [
  { match: 'прогулянка', icon: Footprints, color: 'lime' },
  { match: 'настільні ігри', icon: Gamepad2, color: 'coral' },
  { match: 'вечірка', icon: Martini, color: 'coral' },
  { match: 'інтерактиви', icon: Sparkles, color: 'lime' },
  { match: 'кіно', icon: Film, color: 'coral' }
];

export default function MyEvents() {
  const navigate = useNavigate();
  const [organized, setOrganized] = useState([]);
  const [joined, setJoined] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const res = await apiFetch('/api/events/my', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      setOrganized(data.organized);
      setJoined(data.joined);
    }
    setLoading(false);
  };

  const handleCancel = async (eventId) => {
    if (!window.confirm('Скасувати цю подію? Учасники більше не зможуть приєднатися.')) return;

    const token = localStorage.getItem('token');
    const res = await apiFetch(`/api/events/${eventId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      setMessage('Подію скасовано');
      fetchEvents();
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage(data.error);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const statusLabel = (status) => {
    if (status === 'active') return { text: 'Активна', className: 'bg-lime/15 text-lime border-lime/20' };
    if (status === 'cancelled') return { text: 'Скасована', className: 'bg-white/5 text-gray-500 border-white/10' };
    if (status === 'finished') return { text: 'Завершена', className: 'bg-white/5 text-gray-500 border-white/10' };
    return { text: status, className: 'bg-white/5 text-gray-400 border-white/10' };
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return {
      day: d.toLocaleDateString('uk-UA', { day: 'numeric' }),
      month: d.toLocaleDateString('uk-UA', { month: 'short' }).replace('.', ''),
      time: d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getTheme = (type) => {
    const normalizedType = type.toLowerCase();
    return eventThemes.find((theme) => normalizedType.includes(theme.match)) || {
      icon: Camera,
      color: 'coral'
    };
  };

  const getMapLink = (event) => {
    const latitude = Number(event.latitude);
    const longitude = Number(event.longitude);
    const geoLink = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
    const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    if (typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      return geoLink;
    }

    return googleMapsLink;
  };

  const EventCard = ({ event, isOrganizer }) => {
    const status = statusLabel(event.status);
    const date = formatDate(event.startTime);
    const theme = getTheme(event.type);
    const ThemeIcon = theme.icon;
    const isActive = event.status === 'active';
    return (
      <div className="bg-nightLight/90 rounded-3xl p-4 border border-white/10 shadow-lg shadow-black/10">
        <div className="flex gap-3">
          <div className={`w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center ${theme.color === 'lime' ? 'bg-lime/15 text-lime border border-lime/20' : 'bg-coral/15 text-coral border border-coral/20'}`}>
            <ThemeIcon size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex justify-between items-start gap-2">
              <p className="font-display font-semibold text-white leading-snug">{event.type}</p>
              <span className={`flex-shrink-0 text-[11px] font-medium border rounded-full px-2 py-1 ${status.className}`}>
                {status.text}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-xs mt-2">
              <CalendarDays size={14} className="text-coral" />
              <span>{date.day} {date.month}</span>
              <span className="text-gray-700">•</span>
              <span>{date.time}</span>
            </div>
          </div>
        </div>

        <a
          href={getMapLink(event)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-xl bg-night border border-white/5 text-lime text-xs hover:bg-lime/10 transition"
          aria-label="Відкрити локацію події в навігаторі"
        >
          <MapPin size={14} className="text-lime" />
          <span>Знайти локацію</span>
        </a>
        {event.comment && <p className="text-gray-400 text-sm mt-3 leading-relaxed">{event.comment}</p>}

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => navigate(`/chat/${event.id}`)}
            className="flex-1 bg-coral text-white text-sm font-medium rounded-xl py-2.5 flex items-center justify-center gap-2 hover:opacity-90 transition"
          >
            <MessageCircle size={16} />
            Відкрити чат
          </button>
          {isOrganizer && isActive && (
            <button
              onClick={() => handleCancel(event.id)}
              className="w-11 bg-night text-gray-400 rounded-xl flex items-center justify-center hover:bg-coral/15 hover:text-coral transition"
              aria-label="Скасувати подію"
              title="Скасувати подію"
            >
              <XCircle size={18} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-night p-4 pb-10 relative overflow-hidden">
      <div className="absolute -top-28 -right-20 w-64 h-64 rounded-full bg-coral/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-24 w-56 h-56 rounded-full bg-lime/5 blur-3xl pointer-events-none" />
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/menu')}
            className="w-10 h-10 rounded-xl bg-nightLight text-gray-300 flex items-center justify-center hover:text-white hover:bg-white/10 transition"
            aria-label="Назад до меню"
          >
            <ArrowLeft size={19} />
          </button>
          <div>
            <p className="text-coral text-xs font-medium uppercase tracking-[0.18em] mb-1">Твій календар</p>
            <h1 className="font-display text-2xl font-bold text-white">Заплановані події</h1>
          </div>
        </div>

        {message && (
          <div className="mb-5 bg-lime/15 border border-lime/20 text-lime text-sm font-medium px-4 py-3 rounded-xl text-center flex items-center justify-center gap-2">
            <CircleAlert size={16} />
            {message}
          </div>
        )}

        {loading ? (
          <div className="bg-nightLight/60 border border-white/10 rounded-2xl p-8 text-center">
            <CalendarDays className="mx-auto text-coral mb-3" size={26} />
            <p className="text-gray-400 text-sm">Завантаження подій...</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-[0.16em] mb-1">Ти організатор</p>
                  <h2 className="text-white text-lg font-semibold">Мої івенти</h2>
                </div>
                <span className="text-coral text-sm font-semibold">{organized.length}</span>
              </div>
              {organized.length === 0 ? (
                <div className="bg-nightLight/50 border border-dashed border-white/10 rounded-2xl p-6 text-center">
                  <Plus className="mx-auto text-gray-600 mb-2" size={22} />
                  <p className="text-gray-500 text-sm">Ви ще не створювали подій</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {organized.map((e) => (
                    <EventCard key={e.id} event={e} isOrganizer={true} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-[0.16em] mb-1">Твої зустрічі</p>
                  <h2 className="text-white text-lg font-semibold">Приєднані</h2>
                </div>
                <span className="text-lime text-sm font-semibold">{joined.length}</span>
              </div>
              {joined.length === 0 ? (
                <div className="bg-nightLight/50 border border-dashed border-white/10 rounded-2xl p-6 text-center">
                  <CalendarDays className="mx-auto text-gray-600 mb-2" size={22} />
                  <p className="text-gray-500 text-sm">Ви ще не приєднались до жодної події</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {joined.map((e) => (
                    <EventCard key={e.id} event={e} isOrganizer={false} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}