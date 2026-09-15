import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Martini, Footprints, Film, Dice5, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../api';

const dotPattern = {
  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
  backgroundSize: '16px 16px'
};

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [resetStep, setResetStep] = useState('login');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showVerificationChoice, setShowVerificationChoice] = useState(false);
  const [telegramLink, setTelegramLink] = useState('');
  const [passwordBotLink, setPasswordBotLink] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedMsg, setVerifiedMsg] = useState('');

  const [regData, setRegData] = useState({
    name: '',
    age: '',
    gender: 'чоловік',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/menu');
    }
  }, []);

  const handlePhoneChange = (value, setter) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 9);
    setter(digitsOnly);
  };

  const handleNameChange = (value) => {
    const lettersOnly = value.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ\s-]/g, '');
    setRegData({ ...regData, name: lettersOnly });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (loginPhone.length !== 9) {
      setError('Введіть 9 цифр номера телефону');
      return;
    }

    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+380' + loginPhone, password: loginPassword })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      navigate('/menu');
    } else {
      setError(data.error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!regData.name.trim()) {
      setError('Введіть імя');
      return;
    }

    if (regData.phone.length !== 9) {
      setError('Введіть 9 цифр номера телефону');
      return;
    }

    const ageNum = Number(regData.age);
    if (!regData.age || isNaN(ageNum) || ageNum <= 0 || ageNum >= 100) {
      setError('Введіть коректний вік');
      return;
    }

    if (regData.password.length < 4) {
      setError('Пароль має містити мінімум 4 символи');
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }

    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: regData.name.trim(),
        age: ageNum,
        gender: regData.gender,
        phone: '+380' + regData.phone,
        password: regData.password
      })
    });
    const data = await res.json();
    if (res.ok) {
      setIsLogin(true);
      setLoginPhone(regData.phone);
      setLoginPassword('');
      const linkRes = await apiFetch('/api/auth/telegram-link');
      const linkData = await linkRes.json();
      setTelegramLink(linkData.link || '');
      setShowVerificationChoice(true);
    } else {
      setError(data.error);
    }
  };

  const requestPasswordReset = async (e) => {
    e.preventDefault();
    setError('');

    if (loginPhone.length !== 9) {
      setError('Введіть 9 цифр номера телефону');
      return;
    }

    setResetLoading(true);
    const res = await apiFetch('/api/auth/password-reset/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+380' + loginPhone })
    });
    const data = await res.json();
    setResetLoading(false);

    if (res.ok) {
      setResetStep('confirm');
    } else {
      setError(data.error);
      if (data.botLink) setPasswordBotLink(data.botLink);
    }
  };

  const confirmPasswordReset = async (e) => {
    e.preventDefault();
    setError('');

    if (resetCode.length !== 6) {
      setError('Введіть 6-значний код із Telegram');
      return;
    }
    if (resetPassword.length < 4) {
      setError('Пароль має містити мінімум 4 символи');
      return;
    }

    setResetLoading(true);
    const res = await apiFetch('/api/auth/password-reset/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '+380' + loginPhone,
        code: resetCode,
        password: resetPassword
      })
    });
    const data = await res.json();
    setResetLoading(false);

    if (res.ok) {
      setResetStep('login');
      setLoginPassword('');
      setResetCode('');
      setResetPassword('');
      setError('Пароль змінено. Тепер увійдіть з новим паролем.');
    } else {
      setError(data.error);
    }
  };

  useEffect(() => {
    if (!showVerificationChoice || loginPhone.length !== 9) return;

    const timer = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/auth/verification-status?phone=%2B380${loginPhone}`);
        const data = await res.json();
        if (data.verified) {
          setIsVerified(true);
          clearInterval(timer);
        }
      } catch {}
    }, 3000);

    return () => clearInterval(timer);
  }, [showVerificationChoice, loginPhone]);

  return (
    <div className="min-h-screen bg-night flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0" style={dotPattern}></div>
      <div className="absolute -top-20 -left-16 w-64 h-64 bg-coral rounded-full blur-3xl opacity-30"></div>
      <div className="absolute top-24 -right-20 w-56 h-56 bg-lime rounded-full blur-3xl opacity-20"></div>

      <div className="w-full max-w-sm relative z-10">

        <div className="flex justify-between items-start mb-4">
          <span className="bg-lime text-night text-xs font-semibold px-3 py-1.5 rounded-full -rotate-3 inline-block">
            зустрічі щодня
          </span>
          <MapPin className="text-coral rotate-12" size={22} />
        </div>

        <div className="mb-4">
          <h1 className="font-display text-5xl font-bold text-white leading-none tracking-tight -rotate-1 inline-block">
            Разом<span className="text-coral">.</span>
          </h1>
          <p className="text-lime text-sm font-medium mt-2 ml-1">
            хтось поруч теж не хоче сидіти вдома
          </p>
        </div>

        <div className="flex mb-5">
          <div className="w-11 h-11 rounded-xl bg-coral flex items-center justify-center border-2 border-night -rotate-6 -mr-3 z-40 shadow-lg">
            <Martini size={20} className="text-white" />
          </div>
          <div className="w-11 h-11 rounded-xl bg-lime flex items-center justify-center border-2 border-night rotate-3 -mr-3 z-30 shadow-lg">
            <Footprints size={20} className="text-night" />
          </div>
          <div className="w-11 h-11 rounded-xl bg-nightLight flex items-center justify-center border-2 border-night -rotate-3 -mr-3 z-20 shadow-lg">
            <Film size={20} className="text-white" />
          </div>
          <div className="w-11 h-11 rounded-xl bg-coral flex items-center justify-center border-2 border-night rotate-6 z-10 shadow-lg">
            <Dice5 size={20} className="text-white" />
          </div>
        </div>

        <div className="bg-nightLight rounded-3xl p-5 border border-white/5">
          <div className="flex mb-4 bg-night rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-display font-semibold transition ${isLogin ? 'bg-coral text-white' : 'text-gray-400'}`}
            >
              Вхід
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-display font-semibold transition ${!isLogin ? 'bg-lime text-night' : 'text-gray-400'}`}
            >
              Реєстрація
            </button>
          </div>

          {isLogin && resetStep === 'login' && (
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <div className="flex bg-night rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-coral transition">
                <span className="text-gray-400 px-4 py-3.5 select-none border-r border-white/5 text-sm">+380</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="991234567"
                  value={loginPhone}
                  onChange={(e) => handlePhoneChange(e.target.value, setLoginPhone)}
                  className="bg-transparent text-white placeholder-gray-600 py-3.5 pl-3 pr-4 outline-none flex-1 text-sm"
                />
              </div>

              <div className="flex items-center bg-night rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-coral transition">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Пароль"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="bg-transparent text-white placeholder-gray-600 px-4 py-3.5 outline-none flex-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 px-4 hover:text-white transition"
                >
                  {showPassword && <EyeOff size={18} />}
                  {!showPassword && <Eye size={18} />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setResetStep('request'); setError(''); }}
                className="text-gray-500 hover:text-lime text-xs text-right transition"
              >
                Забули пароль?
              </button>

              {error && (
                <p className="text-coral text-sm bg-coral/10 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                className="bg-coral text-white font-display font-semibold rounded-xl py-3.5 mt-1 hover:opacity-90 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                Погнали
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {isLogin && resetStep === 'request' && (
            <form onSubmit={requestPasswordReset} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => { setResetStep('login'); setError(''); }}
                  className="text-gray-400 hover:text-white transition"
                  aria-label="Назад до входу"
                >
                  <ArrowLeft size={18} />
                </button>
                <p className="text-white font-display font-semibold">Відновлення пароля</p>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Введіть номер. Код для відновлення прийде у привʼязаний Telegram.
              </p>
              <div className="flex bg-night rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-coral transition">
                <span className="text-gray-400 px-4 py-3.5 select-none border-r border-white/5 text-sm">+380</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="991234567"
                  value={loginPhone}
                  onChange={(e) => handlePhoneChange(e.target.value, setLoginPhone)}
                  className="bg-transparent text-white placeholder-gray-600 py-3.5 pl-3 pr-4 outline-none flex-1 text-sm"
                />
              </div>
              {error && <p className="text-coral text-sm bg-coral/10 rounded-lg px-3 py-2">{error}</p>}
              {passwordBotLink && (
                <button
                  type="button"
                  onClick={() => window.open(passwordBotLink, '_blank', 'noopener,noreferrer')}
                  className="text-lime text-sm text-left hover:underline"
                >
                  Відкрити password bot і прив'язати номер
                </button>
              )}
              <button
                type="submit"
                disabled={resetLoading}
                className="bg-coral text-white font-display font-semibold rounded-xl py-3.5 mt-1 hover:opacity-90 transition disabled:opacity-50"
              >
                {resetLoading ? 'Надсилаємо...' : 'Надіслати код'}
              </button>
            </form>
          )}

          {isLogin && resetStep === 'confirm' && (
            <form onSubmit={confirmPasswordReset} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => { setResetStep('request'); setError(''); }}
                  className="text-gray-400 hover:text-white transition"
                  aria-label="Назад до номера"
                >
                  <ArrowLeft size={18} />
                </button>
                <p className="text-white font-display font-semibold">Новий пароль</p>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Введіть код із Telegram і придумайте новий пароль.
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="bg-night text-white placeholder-gray-600 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-coral transition w-full text-sm tracking-[0.3em]"
              />
              <input
                type="password"
                placeholder="Новий пароль"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="bg-night text-white placeholder-gray-600 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-coral transition w-full text-sm"
              />
              {error && <p className="text-coral text-sm bg-coral/10 rounded-lg px-3 py-2">{error}</p>}
              <button
                type="submit"
                disabled={resetLoading}
                className="bg-lime text-night font-display font-semibold rounded-xl py-3.5 mt-1 hover:opacity-90 transition disabled:opacity-50"
              >
                {resetLoading ? 'Зберігаємо...' : 'Змінити пароль'}
              </button>
            </form>
          )}

          {!isLogin && (
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Імя"
                value={regData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="bg-night text-white placeholder-gray-600 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-coral transition w-full text-sm"
              />

              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Вік"
                  value={regData.age}
                  onChange={(e) => setRegData({ ...regData, age: e.target.value })}
                  className="bg-night text-white placeholder-gray-600 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-coral transition flex-1 text-sm"
                />
                <select
                  value={regData.gender}
                  onChange={(e) => setRegData({ ...regData, gender: e.target.value })}
                  className="bg-night text-white rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-coral transition flex-1 text-sm"
                >
                  <option value="чоловік">Чоловік</option>
                  <option value="жінка">Жінка</option>
                </select>
              </div>

              <div className="flex bg-night rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-coral transition">
                <span className="text-gray-400 px-4 py-3.5 select-none border-r border-white/5 text-sm">+380</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="991234567"
                  value={regData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value, (val) => setRegData({ ...regData, phone: val }))}
                  className="bg-transparent text-white placeholder-gray-600 py-3.5 pl-3 pr-4 outline-none flex-1 text-sm"
                />
              </div>

              <div className="flex items-center bg-night rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-coral transition">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Пароль"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  className="bg-transparent text-white placeholder-gray-600 px-4 py-3.5 outline-none flex-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 px-4 hover:text-white transition"
                >
                  {showPassword && <EyeOff size={18} />}
                  {!showPassword && <Eye size={18} />}
                </button>
              </div>

              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Підтвердіть пароль"
                value={regData.confirmPassword}
                onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                className="bg-night text-white placeholder-gray-600 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-coral transition w-full text-sm"
              />

              {error && (
                <p className="text-coral text-sm bg-coral/10 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                className="bg-lime text-night font-display font-semibold rounded-xl py-3.5 mt-1 hover:opacity-90 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                Приєднатись
                <ArrowRight size={18} />
              </button>
            </form>
          )}
        </div>
      </div>

            {showVerificationChoice && (
        <div className="fixed inset-0 z-50 bg-night/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-nightLight border border-white/10 rounded-3xl p-5 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-lime/15 text-lime flex items-center justify-center mb-4">
              <ArrowRight size={22} />
            </div>
            <h2 className="text-white font-display text-xl font-bold">Підтвердити акаунт?</h2>
            <p className="text-gray-400 text-sm leading-relaxed mt-2">
              Натисніть «Верифікувати акаунт», поділіться номером у боті, а тоді поверніться сюди — кнопка «Готово» стане активною сама.
            </p>
            <div className="flex flex-col gap-2 mt-5">
              <button
                type="button"
                onClick={() => telegramLink && window.open(telegramLink, '_blank', 'noopener,noreferrer')}
                disabled={!telegramLink}
                className="bg-lime text-night font-display font-semibold rounded-xl py-3.5 transition hover:opacity-90 disabled:opacity-50"
              >
                Верифікувати акаунт
              </button>
              <button
                type="button"
                disabled={!isVerified}
                onClick={() => {
                  setShowVerificationChoice(false);
                  setIsVerified(false);
                  setVerifiedMsg('Акаунт підтверджено!');
                }}
                className="bg-lime text-night font-display font-semibold rounded-xl py-3.5 transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isVerified ? 'Готово ✓' : 'Очікуємо підтвердження...'}
              </button>
                            <button
                type="button"
                onClick={() => setShowVerificationChoice(false)}
                className="bg-night text-gray-300 font-medium rounded-xl py-3.5 hover:bg-white/10 transition"
              >
                Продовжити без верифікації
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}