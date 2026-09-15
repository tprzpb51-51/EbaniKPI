import { useNavigate } from 'react-router-dom';

export default function Menu() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-night flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-10">
          <h1 className="font-display text-3xl font-bold text-white">Разом</h1>
          <button onClick={logout} className="text-gray-400 text-sm hover:text-coral transition">
            Вийти
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/create')}
            className="bg-coral text-white font-display font-semibold text-lg rounded-2xl py-6 hover:opacity-90 transition text-left px-6"
          >
            Створити івент
            <p className="text-sm font-body font-normal opacity-80 mt-1">Заплануй свою зустріч</p>
          </button>

          <button
            onClick={() => navigate('/map')}
            className="bg-lime text-night font-display font-semibold text-lg rounded-2xl py-6 hover:opacity-90 transition text-left px-6"
          >
            Доєднатись до івенту
            <p className="text-sm font-body font-normal opacity-70 mt-1">Знайди щось поруч</p>
          </button>

          <button
            onClick={() => navigate('/my-events')}
            className="bg-nightLight text-white font-display font-semibold text-lg rounded-2xl py-6 hover:opacity-90 transition text-left px-6 border border-white/10"
          >
            Заплановані події
            <p className="text-sm font-body font-normal opacity-60 mt-1">Твої майбутні зустрічі</p>
          </button>
        </div>
      </div>
    </div>
  );
}