import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Map, CheckSquare, FolderOpen, Home, Settings, LogOut, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, API_BASE_URL, api } from '../lib/utils';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Map, label: 'Itinerary', path: '/itinerary' },
  { icon: CheckSquare, label: 'Tasks', path: '/todos' },
  { icon: Wallet, label: 'Budget', path: '/budget' },
  { icon: FolderOpen, label: 'Documents', path: '/documents' },
  { icon: Home, label: 'Stays', path: '/stays' },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({ display_name: 'User', username: '' });

  useEffect(() => {
    api.get('/api/me')
      .then(res => setUser(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/api/logout');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <div className="flex h-full w-full bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200 flex-col justify-between p-6 shadow-xl z-20">
        <div>
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Map className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              Trip<span className="font-light">Flow</span>
            </h1>
          </div>

          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                    isActive 
                      ? "text-blue-600 bg-blue-50 font-medium shadow-sm" 
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                  <item.icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-gray-100">
            <Link to="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl w-full transition-colors">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
            </Link>
            <div onClick={handleLogout} className="mt-4 flex items-center gap-3 px-4 py-3 bg-gray-900 text-white rounded-xl shadow-lg shadow-gray-900/20 cursor-pointer hover:bg-gray-800 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center font-bold text-xs text-black">
                    {user.display_name ? user.display_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-grow overflow-hidden">
                    <p className="text-sm font-medium truncate">{user.display_name || user.username}</p>
                    <p className="text-xs text-gray-400">Traveler</p>
                </div>
                <LogOut className="w-4 h-4 text-gray-400" />
            </div>
        </div>
      </aside>

      {/* Content Wrapper (Mobile: Flex Col, Desktop: Flex Col) */}
      <div className="flex flex-1 flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex-none bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] z-40 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Map className="text-white w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                Trip<span className="font-light">Flow</span>
                </h1>
            </div>
            <Link to="/settings" className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center font-bold text-xs text-black shadow-md">
                {user.display_name ? user.display_name.charAt(0).toUpperCase() : 'U'}
            </Link>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative w-full bg-gray-50/50" id="main-scroll-container">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none fixed"></div>
            <div className="max-w-7xl mx-auto p-4 md:p-10 relative z-10">
                {children}
            </div>
            {/* Bottom Spacer for Mobile Nav */}
            <div className="h-24 md:hidden"></div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden flex-none bg-white border-t border-gray-200 p-2 flex justify-around z-50 pb-safe">
            {sidebarItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <Link key={item.path} to={item.path} className={cn("flex flex-col items-center gap-1 p-2 rounded-lg", isActive ? "text-blue-600 bg-blue-50" : "text-gray-400")}>
                        <item.icon className="w-5 h-5" />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                )
            })}
        </nav>
      </div>
    </div>
  );
}