import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Save, User, MapPin, Lock, LogOut, Calendar, Wallet } from 'lucide-react';
import { API_BASE_URL, api } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    display_name: '',
    home_city: '',
    home_lat: 0,
    home_lon: 0,
    username: '',
    trip_date: '',
    budget_limit: 0
  });
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/me');
      setProfile(res.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const updateData = { ...profile };
      if (password) updateData.password = password;
      
      const res = await api.put('/api/me', updateData);
      setProfile(res.data);
      setPassword('');
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error saving settings.');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/api/logout');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const handleSearchLocation = async (query) => {
    if (!query) return;
    try {
      // External API call - do NOT use 'api' instance to avoid sending credentials
      const res = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=en&format=json`);
      setSearchResults(res.data.results || []);
    } catch (error) {
      console.error("Error searching location:", error);
    }
  };

  const selectLocation = (result) => {
    setProfile({
      ...profile,
      home_city: `${result.name}, ${result.country}`,
      home_lat: result.latitude,
      home_lon: result.longitude
    });
    setSearchResults([]);
    setIsSearching(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8 pt-2">Settings</h1>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8">
        {message && (
          <div className={`p-4 rounded-xl mb-6 text-center ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" /> Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input 
                  type="text" 
                  value={profile.username} 
                  disabled 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input 
                  type="text" 
                  value={profile.display_name || ''} 
                  onChange={(e) => setProfile({...profile, display_name: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Trip Settings */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Trip Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trip Date</label>
                <input 
                  type="date" 
                  value={profile.trip_date || ''} 
                  onChange={(e) => setProfile({...profile, trip_date: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Limit (¥)</label>
                <input 
                  type="number" 
                  value={profile.budget_limit || ''} 
                  onChange={(e) => setProfile({...profile, budget_limit: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Weather Location Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" /> Default Weather Location
            </h2>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input 
                type="text" 
                value={profile.home_city || ''} 
                onChange={(e) => {
                  setProfile({...profile, home_city: e.target.value});
                  handleSearchLocation(e.target.value);
                  setIsSearching(true);
                }}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Search for a city..."
              />
              {isSearching && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button 
                      key={result.id}
                      type="button"
                      onClick={() => selectLocation(result)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                    >
                      <span className="font-bold">{result.name}</span>
                      <span className="text-gray-500 ml-2">{result.admin1}, {result.country}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                <span>Lat: {profile.home_lat?.toFixed(4)}</span>
                <span>Lon: {profile.home_lon?.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Security Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" /> Security
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Leave blank to keep current password"
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> Save Changes
            </button>
          </div>
        </form>
      </div>

      <button 
        onClick={handleLogout}
        className="w-full bg-white border border-red-100 text-red-600 font-bold py-3 px-4 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2 mb-8"
      >
        <LogOut className="w-5 h-5" /> Log Out
      </button>
    </motion.div>
  );
}
