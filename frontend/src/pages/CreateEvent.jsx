import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { ArrowLeft, Search, Camera, ChevronDown } from 'lucide-react';
import { apiFetch } from '../api';

const THEMES = {
  'прогулянка': {
    label: 'Прогулянка',
    subtypes: ['Пробіжка', 'Нове знайомство', 'Вечірня прогулянка'],
  },
  'ігри': {
    label: 'Настільні ігри',
    subtypes: ['Настільні ігри в клубі', 'Настільні ігри вдома'],
  },
  'вечірка': {
    label: 'Вечірка',
    subtypes: ['Випити в хорошій компанії ', 'Вечірка без алкоголю', '18+'],
  },
  'інтерактиви': {
    label: 'Інтерактиви',
    subtypes: ['Футбол', 'Баскетбол', 'Страйкбол', 'Рибалка'],
  },
};

const GENDER_OPTIONS = [
  { value: 'будь-яка', label: 'Всі' },
  { value: 'чоловік', label: 'Чоловіки' },
  { value: 'жінка', label: 'Жінки' },
];

const TIME_SLOTS = ['12:00', '14:00', '16:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

function getNextDays(count) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    let label;
    if (i === 0) label = 'Сьогодні';
    else if (i === 1) label = 'Завтра';
    else label = d.toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric' });
    days.push({ date: d, label });
  }
  return days;
}

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15);
    }
  }, [position]);
  return null;
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [theme, setTheme] = useState('');
  const [subtype, setSubtype] = useState('');
  const [customSubtype, setCustomSubtype] = useState('');

  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(35);
  const [genderPreference, setGenderPreference] = useState('будь-яка');
  const [maxParticipants, setMaxParticipants] = useState(5);
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState(null);

  const [position, setPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState([50.4501, 30.5234]);
  const [addressQuery, setAddressQuery] = useState('');
  const [addressResults, setAddressResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const days = getNextDays(7);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [useCustomTime, setUseCustomTime] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {}
      );
    }
  }, []);

  const handleAddressSearch = async (e) => {
    e.preventDefault();
    if (!addressQuery.trim()) return;
    setSearching(true);
    setAddressResults([]);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(addressQuery)}&accept-language=uk&countrycodes=ua&limit=5`
      );
      const data = await res.json();
      setAddressResults(data);
    } catch (err) {
      setError('Не вдалось знайти адресу, спробуйте ще раз');
    }
    setSearching(false);
  };

  const selectAddress = (result) => {
    const coords = [parseFloat(result.lat), parseFloat(result.lon)];
    setPosition(coords);
    setMapCenter(coords);
    setAddressResults([]);
    setAddressQuery(result.display_name);
  };

  const getStartTimeISO = () => {
    if (!selectedTime && !useCustomTime) return null;
    const time = useCustomTime ? customTime : selectedTime;
    if (!time) return null;
    const day = days[selectedDayIndex].date;
    const [hours, minutes] = time.split(':');
    const combined = new Date(day);
    combined.setHours(Number(hours), Number(minutes), 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    return `${combined.getFullYear()}-${pad(combined.getMonth() + 1)}-${pad(combined.getDate())}T${pad(combined.getHours())}:${pad(combined.getMinutes())}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!theme) return setError('Оберіть тему івенту');
    if (!subtype) return setError('Оберіть формат');
    if (subtype === 'Свій варіант' && !customSubtype.trim()) return setError('Опишіть свій варіант');
    if (!position) return setError('Вкажіть локацію на карті — натисніть на потрібну точку');

    const startTime = getStartTimeISO();
    if (!startTime) return setError('Оберіть дату і час');

    if (Number(ageMin) > Number(ageMax)) return setError('Мінімальний вік не може бути більшим за максимальний');

    setLoading(true);

    const finalType = subtype === 'Свій варіант'
      ? `${THEMES[theme].label}: ${customSubtype.trim()}`
      : `${THEMES[theme].label}: ${subtype}`;

    const formData = new FormData();
    formData.append('type', finalType);
    formData.append('ageMin', ageMin);
    formData.append('ageMax', ageMax);
    formData.append('genderPreference', genderPreference);
    formData.append('maxParticipants', maxParticipants);
    formData.append('comment', comment);
    formData.append('latitude', position[0]);
    formData.append('longitude', position[1]);
    formData.append('startTime', startTime);
    if (photo) formData.append('photo', photo);

    const token = localStorage.getItem('token');
    const res = await apiFetch('/api/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      navigate('/menu');
    } else {
      setError(data.error || 'Помилка створення події');
    }
  };

  return (
    <div className="min-h-screen bg-night pb-10 relative overflow-hidden">
      <div className="absolute top-[-60px] right-[-40px] w-64 h-64 bg-coral rounded-full blur-3xl opacity-15 pointer-events-none"></div>

      <div className="max-w-md mx-auto p-4 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/menu')} className="text-white">
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display text-2xl font-bold text-white">Новий івент</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Тема</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(THEMES).map(([key, t]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setTheme(key); setSubtype(''); setCustomSubtype(''); }}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition text-left ${
                    theme === key
                      ? 'bg-coral text-white'
                      : 'bg-nightLight text-gray-300 border border-white/10'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {theme && (
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Формат</label>
              <div className="relative">
                <select
                  value={subtype}
                  onChange={(e) => setSubtype(e.target.value)}
                  className="bg-nightLight text-white rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-coral w-full appearance-none pr-10"
                >
                  <option value="">Оберіть формат</option>
                  {THEMES[theme].subtypes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="Свій варіант">Свій варіант</option>
                </select>
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>

              {subtype === 'Свій варіант' && (
                <input
                  type="text"
                  placeholder="Опишіть свій формат події"
                  value={customSubtype}
                  onChange={(e) => setCustomSubtype(e.target.value)}
                  className="bg-nightLight text-white placeholder-gray-500 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-coral w-full mt-2"
                />
              )}
            </div>
          )}

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Дата</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {days.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedDayIndex(i)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                    selectedDayIndex === i
                      ? 'bg-lime text-night'
                      : 'bg-nightLight text-gray-300 border border-white/10'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Час</label>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setSelectedTime(t); setUseCustomTime(false); }}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                    !useCustomTime && selectedTime === t
                      ? 'bg-coral text-white'
                      : 'bg-nightLight text-gray-300 border border-white/10'
                  }`}
                >
                  {t}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUseCustomTime(true)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                  useCustomTime
                    ? 'bg-coral text-white'
                    : 'bg-nightLight text-gray-300 border border-white/10'
                }`}
              >
                Інший час
              </button>
            </div>
            {useCustomTime && (
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="bg-nightLight text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-coral mt-2 w-full"
                style={{ colorScheme: 'dark' }}
              />
            )}
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Вік учасників</label>
            <div className="flex items-center gap-3 bg-nightLight rounded-xl px-4 py-3">
              <input
                type="number"
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
                className="bg-transparent text-white w-16 outline-none text-center"
              />
              <span className="text-gray-500">—</span>
              <input
                type="number"
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
                className="bg-transparent text-white w-16 outline-none text-center"
              />
              <span className="text-gray-500 text-sm ml-auto">років</span>
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Стать учасників</label>
            <div className="flex gap-2">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGenderPreference(g.value)}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    genderPreference === g.value
                      ? 'bg-lime text-night'
                      : 'bg-nightLight text-gray-300 border border-white/10'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Максимум учасників</label>
            <input
              type="number"
              min="1"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              className="bg-nightLight text-white rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-coral w-full"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Локація</label>

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Введіть адресу для пошуку"
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddressSearch(e); }}
                className="bg-nightLight text-white placeholder-gray-500 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-coral flex-1"
              />
              <button
                type="button"
                onClick={handleAddressSearch}
                disabled={searching}
                className="bg-nightLight border border-white/10 rounded-xl px-4 text-white disabled:opacity-50"
              >
                <Search size={18} />
              </button>
            </div>

            {addressResults.length > 0 && (
              <div className="bg-nightLight rounded-xl mb-2 overflow-hidden border border-white/10">
                {addressResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectAddress(r)}
                    className="block w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition border-b border-white/5 last:border-0"
                  >
                    {r.display_name}
                  </button>
                ))}
              </div>
            )}

            <p className="text-gray-500 text-xs mb-2">
              Або натисніть на карту, щоб позначити точку вручну
            </p>

            <div className={`rounded-xl overflow-hidden h-64 ${!position ? 'ring-2 ring-coral/50' : ''}`}>
              <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} setPosition={setPosition} />
                <RecenterMap position={mapCenter} />
              </MapContainer>
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">
              Фото локації <span className="text-gray-500">(необов'язково, до 5 МБ)</span>
            </label>
            <label className="flex items-center gap-3 bg-nightLight rounded-xl px-4 py-3.5 cursor-pointer border border-white/10 hover:bg-white/5 transition">
              <Camera size={18} className="text-gray-400" />
              <span className="text-gray-400 text-sm truncate">
                {photo ? photo.name : 'Обрати фото'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">
              Коментар <span className="text-gray-500">(необов'язково)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="bg-nightLight text-white rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-coral w-full resize-none"
              placeholder="Додаткова інформація для учасників..."
            />
          </div>

          {error && <p className="text-coral text-sm bg-coral/10 rounded-lg px-3 py-2 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-coral text-white font-display font-semibold rounded-xl py-3.5 hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
          >
            {loading ? 'Створюємо...' : 'Створити івент'}
          </button>
        </form>
      </div>
    </div>
  );
}