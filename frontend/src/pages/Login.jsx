import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regData, setRegData] = useState({ name: '', age: '', gender: 'чоловік', phone: '', password: '' });

  const handlePhoneChange = (value, setter) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 9);
    setter(digitsOnly);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (loginPhone.length !== 9) {
      setError('Введіть 9 цифр номера телефону');
      return;
    }

    const res = await fetch('/api/auth/login', {
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

    if (regData.phone.length !== 9) {
      setError('Введіть 9 цифр номера телефону');
      return;
    }

    const ageNum = Number(regData.age);
    if (!regData.age || isNaN(ageNum) || ageNum <= 0 || ageNum >= 100) {
      setError('Введіть коректний вік (число менше 100)');
      return;
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...regData, phone: '+380' + regData.phone, age: ageNum })
    });
    const data = await res.json();
    if (res.ok) {
      setIsLogin(true);
      setLoginPhone(regData.phone);
      setLoginPassword('');
    } else {
      setError(data.error);
    }
  };

  return (
    <div className="min-h-screen bg-night flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-4xl font-bold text-white text-center mb-2">
          Разом
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Спонтанні зустрічі поруч з тобою
        </p>

        <div className="bg-nightLight rounded-2xl p-6">
          {isLogin ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <div className="flex bg-night rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-coral">
                <span className="text-gray-400 px-4 py-3 select-none">+380</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="991234567"
                  value={loginPhone}
                  onChange={(e) => handlePhoneChange(e.target.value, setLoginPhone)}
                  className="bg-transparent text-white placeholder-gray-500 py-3 pr-4 outline-none flex-1"
                />
              </div>
              <input
                type="password"
                placeholder="Пароль"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="bg-night text-white placeholder-gray-500 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-coral"
              />
              {error && <p className="text-coral text-sm">{error}</p>}
              <button
                type="submit"
                className="bg-coral text-white font-display font-semibold rounded-lg py-3 mt-2 hover:opacity-90 transition"
              >
                Увійти
              </button>
              <p
                onClick={() => { setIsLogin(false); setError(''); }}
                className="text-gray-400 text-center text-sm mt-2 cursor-pointer hover:text-white transition"
              >
                Немає акаунта? <span className="text-lime">Зареєструватись</span>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Ім'я"
                value={regData.name}
                onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                className="bg-night text-white placeholder-gray-500 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-coral"
              />
              <input
                type="number"
                placeholder="Вік"
                value={regData.age}
                onChange={(e) => setRegData({ ...regData, age: e.target.value })}
                className="bg-night text-white placeholder-gray-500 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-coral"
              />
              <select
                value={regData.gender}
                onChange={(e) => setRegData({ ...regData, gender: e.target.value })}
                className="bg-night text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-coral"
              >
                <option value="чоловік">Чоловік</option>
                <option value="жінка">Жінка</option>
              </select>
              <div className="flex bg-night rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-coral">
                <span className="text-gray-400 px-4 py-3 select-none">+380</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="991234567"
                  value={regData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value, (val) => setRegData({ ...regData, phone: val }))}
                  className="bg-transparent text-white placeholder-gray-500 py-3 pr-4 outline-none flex-1"
                />
              </div>
              <input
                type="password"
                placeholder="Пароль"
                value={regData.password}
                onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                className="bg-night text-white placeholder-gray-500 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-coral"
              />
              {error && <p className="text-coral text-sm">{error}</p>}
              <button
                type="submit"
                className="bg-lime text-night font-display font-semibold rounded-lg py-3 mt-2 hover:opacity-90 transition"
              >
                Зареєструватись
              </button>
              <p
                onClick={() => { setIsLogin(true); setError(''); }}
                className="text-gray-400 text-center text-sm mt-2 cursor-pointer hover:text-white transition"
              >
                Вже є акаунт? <span className="text-coral">Увійти</span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}