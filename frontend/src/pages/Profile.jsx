import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../api';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  Check,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  VenusAndMars,
  XCircle
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    const res = await apiFetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setUser(data);
  };

  const startNameEditing = () => {
    setNameDraft(user.name);
    setError('');
    setEditingName(true);
  };

  const saveName = async () => {
    const name = nameDraft.trim();
    if (!name) {
      setError("Ім'я не може бути порожнім");
      return;
    }

    setSavingName(true);
    setError('');
    const token = localStorage.getItem('token');
    const res = await apiFetch('/api/auth/name', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    setSavingName(false);

    if (res.ok) {
      setUser({ ...user, name: data.name });
      setEditingName(false);
    } else {
      setError(data.error || "Не вдалося оновити ім'я");
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('avatar', file);

    const token = localStorage.getItem('token');
    const res = await apiFetch('/api/auth/avatar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();
    setUploading(false);

    if (res.ok) {
      setUser({ ...user, avatarUrl: data.avatarUrl });
    } else {
      setError(data.error || 'Помилка завантаження');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <p className="text-gray-400">Завантаження...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night p-4 pb-10 relative overflow-hidden">
      <div className="absolute -top-28 -right-20 w-64 h-64 rounded-full bg-coral/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-24 w-56 h-56 rounded-full bg-lime/5 blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="flex items-center gap-3 mb-8 pt-2">
          <button
            onClick={() => navigate('/menu')}
            className="w-10 h-10 rounded-xl bg-nightLight text-gray-300 flex items-center justify-center hover:text-white hover:bg-white/10 transition"
            aria-label="Назад до меню"
          >
            <ArrowLeft size={19} />
          </button>
          <div>
            <p className="text-coral text-xs font-medium uppercase tracking-[0.18em] mb-1">Твій простір</p>
            <h1 className="font-display text-2xl font-bold text-white">Профіль</h1>
          </div>
        </div>

        <div className="bg-nightLight/80 rounded-3xl border border-white/10 p-6 mb-4 shadow-xl shadow-black/10">
          <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-[2rem] rotate-3 overflow-hidden bg-gradient-to-br from-coral to-lime flex items-center justify-center border-4 border-night">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Аватар" className="w-full h-full object-cover -rotate-3 scale-110" />
              ) : (
                <span className="text-4xl font-display font-bold text-night -rotate-3">
                  {user.name?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-10 h-10 bg-coral rounded-xl flex items-center justify-center border-4 border-night hover:opacity-90 transition disabled:opacity-50"
              aria-label="Змінити аватар"
              title="Змінити аватар"
            >
              <Camera size={16} className="text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          </div>
          <div className="mt-5 flex items-center justify-center gap-2">
            {editingName ? (
              <div className="w-full max-w-sm flex items-center gap-2">
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={60}
                  autoFocus
                  className="min-w-0 flex-1 bg-night text-white text-left font-display text-lg sm:text-xl font-bold rounded-xl px-3 py-2.5 outline-none border border-white/10 focus:border-coral/70 focus:ring-1 focus:ring-coral/50"
                  aria-label="Нове ім'я"
                />
                <button
                  type="button"
                  onClick={saveName}
                  disabled={savingName}
                  className="w-11 h-11 flex-shrink-0 rounded-xl bg-lime text-night flex items-center justify-center hover:bg-lime/90 transition disabled:opacity-50"
                  aria-label="Зберегти ім'я"
                >
                  <Check size={17} />
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-display text-2xl font-bold text-white">{user.name}</h2>
                <BadgeCheck size={19} className="text-lime" />
                <button
                  type="button"
                  onClick={startNameEditing}
                  className="w-8 h-8 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
                  aria-label="Змінити ім'я"
                  title="Змінити ім'я"
                >
                  <Pencil size={15} />
                </button>
              </>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">Відкритий до нових зустрічей</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-lime/10 border border-lime/20 px-3 py-1.5 text-lime text-xs font-medium">
            <Sparkles size={14} />
            Учасник спільноти
          </div>
          {uploading && <p className="text-gray-400 text-xs mt-3">Завантаження...</p>}
          {error && <p className="text-coral text-xs mt-3">{error}</p>}
        </div>

        <div className="bg-nightLight/80 rounded-3xl p-5 border border-white/10 shadow-lg shadow-black/10">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={17} className="text-coral" />
            <h2 className="text-white font-semibold">Особисті дані</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-night rounded-2xl p-3 border border-white/5">
              <UserRound size={16} className="text-lime mb-3" />
              <p className="text-gray-500 text-xs mb-1">Ім'я</p>
              <p className="text-white text-sm font-medium truncate">{user.name}</p>
            </div>
            <div className="bg-night rounded-2xl p-3 border border-white/5">
              <CalendarDays size={16} className="text-coral mb-3" />
              <p className="text-gray-500 text-xs mb-1">Вік</p>
              <p className="text-white text-sm font-medium">{user.age} років</p>
            </div>
            <div className="bg-night rounded-2xl p-3 border border-white/5">
              <VenusAndMars size={16} className="text-coral mb-3" />
              <p className="text-gray-500 text-xs mb-1">Стать</p>
              <p className="text-white text-sm font-medium capitalize truncate">{user.gender}</p>
            </div>
            <div className="bg-night rounded-2xl p-3 border border-white/5">
              <Phone size={16} className="text-lime mb-3" />
              <p className="text-gray-500 text-xs mb-1">Телефон</p>
              <p className="text-white text-sm font-medium truncate">{user.phone}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between bg-night rounded-2xl px-3 py-3 border border-white/5">
            <div className="flex items-center gap-2">
              {user.phoneVerified ? (
                <CheckCircle2 size={18} className="text-lime" />
              ) : (
                <XCircle size={18} className="text-gray-600" />
              )}
              <div>
                <p className="text-gray-500 text-xs">Статус телефону</p>
                <p className="text-white text-sm font-medium">
                  {user.phoneVerified ? 'Підтверджений' : 'Непідтверджений'}
                </p>
              </div>
            </div>
            <span className={`text-xs ${user.phoneVerified ? 'text-lime' : 'text-gray-500'}`}>
              {user.phoneVerified ? 'Готово' : 'Потрібна перевірка'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}