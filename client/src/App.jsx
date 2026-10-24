import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth, usePrefs } from './store/auth.js';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import LiveCoach from './pages/LiveCoach.jsx';
import Summary from './pages/Summary.jsx';
import Training from './pages/Training.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Inventory from './pages/Inventory.jsx';
import Settings from './pages/Settings.jsx';

function Private({ children, roles }) {
  const user = useAuth((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const lang = usePrefs((s) => s.lang);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Private><Layout /></Private>}>
        <Route index element={<Home />} />
        <Route path="/training" element={<Training />} />
        <Route path="/coach/:id" element={<LiveCoach />} />
        <Route path="/sessions/:id" element={<Summary />} />
        <Route path="/dashboard" element={<Private roles={['supervisor', 'admin']}><Dashboard /></Private>} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
