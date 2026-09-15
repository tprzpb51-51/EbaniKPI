import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Settings, ShieldCheck, UserX, Users, X } from 'lucide-react';
import { apiFetch } from '../api';

function getMyUserId() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.userId;
}

export default function Chat() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [participants, setParticipants] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const bottomRef = useRef(null);
  const myId = getMyUserId();

  useEffect(() => {
    fetchMessages();
    fetchParticipants();
    const interval = setInterval(() => {
      fetchMessages();
      fetchParticipants();
    }, 3000);
    return () => clearInterval(interval);
  }, [eventId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    const token = localStorage.getItem('token');
    const res = await apiFetch(`/api/messages/${eventId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      setMessages(data);
      setError('');
    } else {
      setError(data.error);
    }
  };

  const fetchParticipants = async () => {
    const token = localStorage.getItem('token');
    const res = await apiFetch(`/api/events/${eventId}/participants`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setParticipants(await res.json());
    }
  };

  const blockParticipant = async (userId, userName) => {
    if (!window.confirm(`Заблокувати ${userName} для цієї події?`)) return;

    const token = localStorage.getItem('token');
    const res = await fetch(`/api/events/${eventId}/block/${userId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (res.ok) {
      setParticipants((current) => current.filter((participant) => participant.id !== userId));
      setActionMessage(data.message);
      fetchMessages();
      setTimeout(() => setActionMessage(''), 3000);
    } else {
      setActionMessage(data.error || 'Не вдалося заблокувати користувача');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const token = localStorage.getItem('token');
    const res = await fetch(`/api/messages/${eventId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ text })
    });

    if (res.ok) {
      setText('');
      fetchMessages();
    }
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-night flex flex-col items-center justify-center p-4">
        <p className="text-gray-400 mb-4">{error}</p>
        <button onClick={() => navigate('/my-events')} className="text-coral">
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-night flex flex-col relative overflow-hidden">
      <div className="absolute -top-28 -right-20 w-64 h-64 rounded-full bg-coral/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 -left-24 w-56 h-56 rounded-full bg-lime/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 border-b border-white/10 bg-night/90 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3 relative">
          <button
            onClick={() => navigate('/my-events')}
            className="w-10 h-10 rounded-xl bg-nightLight text-gray-300 flex items-center justify-center hover:text-white hover:bg-white/10 transition"
            aria-label="Назад до подій"
          >
            <ArrowLeft size={19} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-coral/15 border border-coral/30 flex items-center justify-center">
            <Users size={19} className="text-coral" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold text-white leading-tight">Чат події</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-lime" />
              <span className="text-gray-500 text-xs">Спілкування учасників</span>
            </div>
          </div>
        {participants !== null && (
          <button
            type="button"
            onClick={() => setShowParticipants(!showParticipants)}
            className="ml-auto w-10 h-10 rounded-xl bg-nightLight text-gray-300 flex items-center justify-center hover:text-white hover:bg-white/10 transition"
            aria-label="Налаштування учасників"
            title="Налаштування учасників"
          >
            <Settings size={20} />
          </button>
        )}
        {showParticipants && participants !== null && (
          <div className="absolute right-4 top-16 z-20 w-72 bg-nightLight/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white text-sm font-medium">Учасники</p>
                <p className="text-gray-500 text-xs mt-0.5">{participants.length} приєднаних</p>
              </div>
              <button
                type="button"
                onClick={() => setShowParticipants(false)}
                className="text-gray-500 hover:text-white"
                aria-label="Закрити список учасників"
              >
                <X size={16} />
              </button>
            </div>
            {participants.length === 0 ? (
              <p className="text-gray-500 text-sm">Немає приєднаних учасників</p>
            ) : (
              <div className="flex flex-col gap-2">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-coral/15 border border-coral/20 text-coral flex items-center justify-center text-sm font-semibold">
                      {participant.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-gray-200 text-sm flex-1 truncate">{participant.name}</span>
                    <button
                      type="button"
                      onClick={() => blockParticipant(participant.id, participant.name)}
                      className="w-8 h-8 rounded-lg text-coral hover:text-white hover:bg-coral/15 flex items-center justify-center transition"
                      aria-label={`Заблокувати ${participant.name}`}
                      title="Заблокувати для цієї події"
                    >
                      <UserX size={17} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {actionMessage && (
        <div className="absolute top-16 left-4 right-4 z-10 bg-lime text-night text-sm font-medium px-4 py-2 rounded-lg text-center">
          {actionMessage}
        </div>
      )}

      <div className="relative z-0 flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center mt-16">
            <div className="w-14 h-14 rounded-2xl bg-lime/10 border border-lime/20 flex items-center justify-center mb-4">
              <ShieldCheck size={24} className="text-lime" />
            </div>
            <p className="text-white font-medium">Чат ще порожній</p>
            <p className="text-gray-500 text-sm mt-1">Напишіть перше повідомлення учасникам</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === myId;
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
              {!isMine && (
                <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-coral to-lime flex items-center justify-center flex-shrink-0">
                  {msg.sender?.avatarUrl ? (
                    <img src={msg.sender.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-night">{msg.sender?.name?.[0]?.toUpperCase()}</span>
                  )}
                </div>
              )}
              <div className={`flex flex-col max-w-[78%] ${isMine ? 'items-end' : 'items-start'}`}>
                {!isMine && (
                  <span className="text-gray-500 text-xs mb-1 px-1">{msg.sender?.name}</span>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 shadow-sm ${
                    isMine
                      ? 'bg-coral text-white rounded-br-md'
                      : 'bg-nightLight border border-white/10 text-white rounded-bl-md'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
                <span className="text-gray-600 text-xs mt-1 px-1">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
        </div>
      </div>

      <div className="relative z-10 border-t border-white/10 bg-night/90 backdrop-blur-md p-3 sm:p-4">
        <form onSubmit={sendMessage} className="max-w-2xl mx-auto flex items-center gap-2 bg-nightLight border border-white/10 rounded-2xl p-1.5 focus-within:border-coral/60 transition">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Напишіть повідомлення..."
            className="flex-1 min-w-0 bg-transparent text-white placeholder-gray-500 rounded-xl px-3 py-2.5 outline-none text-sm"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="w-10 h-10 flex-shrink-0 bg-coral text-white rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Надіслати повідомлення"
          >
            <Send size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}