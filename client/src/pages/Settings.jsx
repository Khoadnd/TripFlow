import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, User, MapPin, Lock, LogOut, Calendar } from 'lucide-react';
import { api } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import LocationInput from '../components/LocationInput';
import Card from '../components/Card';
import Button from '../components/Button';

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

  const handleLocationSelect = (result) => {
    setProfile({
      ...profile,
      home_city: result.display_name,
      home_lat: parseFloat(result.lat),
      home_lon: parseFloat(result.lon)
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8 pt-2">Settings</h1>

      <Card className="p-6 md:p-8 mb-8">
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
              <LocationInput 
                value={profile.home_city || ''}
                onChange={(val) => setProfile({...profile, home_city: val})}
                onSelect={handleLocationSelect}
                placeholder="Search for a city..."
                className="py-2"
              />
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
            <Button 
              type="submit" 
              className="w-full shadow-lg shadow-blue-600/30"
              icon={Save}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      <Button 
        onClick={handleLogout}
        variant="danger"
        variantType="outline"
        className="w-full mb-8"
        icon={LogOut}
      >
        Log Out
      </Button>
    </motion.div>
  );
}
