import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Itinerary from './pages/Itinerary';
import Todos from './pages/Todos';
import Documents from './pages/Documents';
import Stays from './pages/Stays';
import Budget from './pages/Budget';
import Login from './pages/Login';
import Settings from './pages/Settings';
import { api } from './lib/utils';

function RequireAuth() {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    api.get('/api/me')
      .then(() => setAuth(true))
      .catch(() => setAuth(false));
  }, []);

  if (auth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (auth === false) return <Navigate to="/login" />;
  
  return <Outlet />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<RequireAuth />}>
          <Route element={<Layout><Outlet /></Layout>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/itinerary" element={<Itinerary />} />
            <Route path="/todos" element={<Todos />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/stays" element={<Stays />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
