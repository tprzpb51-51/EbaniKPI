import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Menu from './pages/Menu';
import CreateEvent from './pages/CreateEvent';
import MapPage from './pages/MapPage';
import MyEvents from './pages/MyEvents';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
        <Route path="/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;