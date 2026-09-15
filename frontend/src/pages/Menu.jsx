import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Map, CalendarDays, User, LogOut, Flame, ShieldCheck, X } from 'lucide-react';

export default function Menu() {
  const navigate = useNavigate();
  const [nearbyCount, setNearbyCount] = useState(null);
  const [locationStatus, setLocationStatus] = useState('loading');
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [telegramLink, setTelegramLink] = useState('');

  useEffect(() => {
    fetchUserInfo();

    if (!navigator.geolocation) {
      setLocationStatus('unsupported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationStatus('granted');
        fetchNearbyCount(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocationStatus('denied');
      }
    );
  }, []);

  const fetchUserInfo = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      setUserName(data.name);
      setAvatarUrl(data.avatarUrl || '');
      setPhoneVerified(Boolean(data.phoneVerified));
    }
  };

  const openCreateEvent = async () => {
    if (phoneVerified) {
      navigate('/create');
      return;
    }

    const res = await fetch('/api/auth/telegram-link');
    const data = await res.json();
    setTelegramLink(data.link || '');
    setShowVerification(true);
  };

  const fetchNearbyCount = async (lat, lng) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/events/nearby-count?lat=${lat}&lng=${lng}&radius=15`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setNearbyCount(data.count);
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-night p-4 relative overflow-hidden">
      <div className="absolute top-[-60px] right-[-40px] w-56 h-56 bg-coral rounded-full blur-3xl opacity-20"></div>

      <div className="max-w-sm mx-auto relative z-10">

        <div className="flex justify-between items-center mb-5 pt-2">
          <p className="font-display text-2xl font-bold text-white">
            {userName ? `Привіт, ${userName}` : 'Разом'}
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-coral to-lime flex items-center justify-center border-2 border-nightLight"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={16} className="text-night" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <button
            onClick={openCreateEvent}
            className="bg-coral rounded-2xl p-4 row-span-2 flex flex-col justify-between min-h-[160px] text-left hover:opacity-90 active:scale-[0.98] transition"
          >
            <Plus size={26} className="text-white" />
            <div>
              <p className="text-white font-display font-semibold text-base">Створити</p>
              <p className="text-white/70 text-xs">свій івент</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/map')}
            className="bg-lime rounded-2xl p-3.5 min-h-[75px] flex flex-col justify-between text-left hover:opacity-90 active:scale-[0.98] transition"
          >
            <Map size={18} className="text-night" />
            <p className="text-night font-display font-semibold text-sm">Карта подій</p>
          </button>

          <button
            onClick={() => navigate('/my-events')}
            className="bg-nightLight border border-white/10 rounded-2xl p-3.5 min-h-[75px] flex flex-col justify-between text-left hover:bg-white/5 active:scale-[0.98] transition"
          >
            <CalendarDays size={18} className="text-lime" />
            <p className="text-white font-display font-semibold text-sm">Мої події</p>
          </button>
        </div>

        <div className="flex items-center gap-2.5 bg-white/[0.03] rounded-xl px-3.5 py-2.5 mb-4">
          <Flame size={16} className="text-coral flex-shrink-0" />
          {locationStatus === 'loading' && (
            <p className="text-gray-400 text-xs">Перевіряємо, що поруч...</p>
          )}
          {locationStatus === 'granted' && nearbyCount === null && (
            <p className="text-gray-400 text-xs">Завантаження...</p>
          )}
          {locationStatus === 'granted' && nearbyCount !== null && (
            <p className="text-gray-400 text-xs">
              {nearbyCount === 0
                ? 'Поки немає нових подій поруч за останню добу'
                : `${nearbyCount} нов${nearbyCount === 1 ? 'а подія' : 'их події'} поруч за останню добу`}
            </p>
          )}
          {locationStatus === 'denied' && (
            <p className="text-gray-400 text-xs">
              Дозвольте геолокацію, щоб бачити, що відбувається поруч з вами прямо зараз
            </p>
          )}
          {locationStatus === 'unsupported' && (
            <p className="text-gray-400 text-xs">Геолокація недоступна у вашому браузері</p>
          )}
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 text-gray-500 text-sm mx-auto hover:text-coral transition"
        >
          <LogOut size={14} />
          Вийти
        </button>
      </div>

      {showVerification && (
        <div className="fixed inset-0 z-50 bg-night/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-nightLight border border-white/10 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="w-12 h-12 rounded-2xl bg-coral/15 text-coral flex items-center justify-center">
                <ShieldCheck size={23} />
              </div>
              <button
                type="button"
                onClick={() => setShowVerification(false)}
                className="text-gray-500 hover:text-white transition"
                aria-label="Закрити попередження"
              >
                <X size={18} />
              </button>
            </div>
            <h2 className="text-white font-display text-xl font-bold mt-4">Потрібна верифікація</h2>
            <p className="text-gray-400 text-sm leading-relaxed mt-2">
              Щоб створювати власні події, підтвердіть номер телефону через Telegram.
            </p>
            <div className="flex flex-col gap-2 mt-5">
              <button
                type="button"
                onClick={() => telegramLink && window.open(telegramLink, '_blank', 'noopener,noreferrer')}
                disabled={!telegramLink}
                className="bg-lime text-night font-display font-semibold rounded-xl py-3.5 hover:opacity-90 transition disabled:opacity-50"
              >
                Верифікувати акаунт
              </button>
              <button
                type="button"
                onClick={() => setShowVerification(false)}
                className="bg-night text-gray-300 font-medium rounded-xl py-3.5 hover:bg-white/10 transition"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}