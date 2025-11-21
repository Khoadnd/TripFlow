import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Clock, CloudSun, Wallet, ArrowRight, MapPin, Calendar as CalendarIcon, CloudRain, CloudSnow, CloudLightning, Sun, Cloud, Search, X, Droplets } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, ComposedChart, Line, XAxis, Tooltip } from 'recharts';
import { format, differenceInDays, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import Map from '../components/Map';
import { API_BASE_URL, api } from '../lib/utils';

const API_URL = `${API_BASE_URL}/api/itinerary`;
const EXPENSES_URL = `${API_BASE_URL}/api/expenses`;

export default function Dashboard() {
  const [nextItem, setNextItem] = useState(null);
  const [itineraryItems, setItineraryItems] = useState([]);
  const [tripDate, setTripDate] = useState(new Date('2025-12-01'));
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  const [chartData, setChartData] = useState([]);
  const navigate = useNavigate();
  const [user, setUser] = useState({ display_name: 'Traveler' });

  // Weather State
  const [weather, setWeather] = useState(null);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [location, setLocation] = useState({ name: 'HangZhou, China', lat: 30.29365, lon: 120.16142 });
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    fetchUserProfile();
    fetchItinerary();
    fetchExpenses();
  }, []);

  const daysDiff = differenceInDays(tripDate, new Date());
  const isTripStarted = daysDiff <= 0;
  const displayCount = isTripStarted ? `Day ${Math.abs(daysDiff) + 1}` : `${daysDiff} Days`;
  const displayLabel = isTripStarted ? "Current Day" : "Trip Countdown";

  useEffect(() => {
    if (location.lat && location.lon) {
        fetchWeather(location.lat, location.lon);
    }
  }, [location]);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/api/me');
      setUser(res.data);
      if (res.data.trip_date) {
          setTripDate(new Date(res.data.trip_date));
      }
      if (res.data.home_city && res.data.home_lat && res.data.home_lon) {
        setLocation({
          name: res.data.home_city,
          lat: res.data.home_lat,
          lon: res.data.home_lon
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchWeather = async (lat, lon) => {
    try {
      const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,precipitation_probability,weather_code&timezone=auto&forecast_days=2`);
      setWeather(res.data);
      
      // Process hourly data for today (00:00 to 24:00)
      const hourly = res.data.hourly;
      
      // We take the first 25 hours (00:00 today to 00:00 tomorrow) to cover the full day
      const todayForecast = hourly.time.slice(0, 25).map((time, i) => {
        let timeStr = time.substring(11, 16);
        if (i === 24) timeStr = "24:00";
        return {
            time: timeStr,
            temp: Math.round(hourly.temperature_2m[i]),
            rainChance: hourly.precipitation_probability[i],
            code: hourly.weather_code[i]
        };
      }).filter((_, i) => i % 3 === 0); // Take every 3rd hour: 00, 03, 06, 09, 12, 15, 18, 21, 24
      
      setHourlyForecast(todayForecast);
    } catch (error) {
      console.error("Error fetching weather:", error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${searchQuery}&count=5&language=en&format=json`);
      setSearchResults(res.data.results || []);
    } catch (error) {
      console.error("Error searching location:", error);
    }
  };

  const selectLocation = (result) => {
    setLocation({
      name: `${result.name}, ${result.country}`,
      lat: result.latitude,
      lon: result.longitude
    });
    setIsSearching(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const getWeatherIcon = (code) => {
    if (code === 0) return <Sun className="w-10 h-10 text-yellow-300" />;
    if (code <= 3) return <CloudSun className="w-10 h-10 text-yellow-300" />;
    if (code <= 48) return <Cloud className="w-10 h-10 text-gray-300" />;
    if (code <= 67) return <CloudRain className="w-10 h-10 text-blue-300" />;
    if (code <= 77) return <CloudSnow className="w-10 h-10 text-white" />;
    if (code <= 82) return <CloudRain className="w-10 h-10 text-blue-400" />;
    if (code <= 86) return <CloudSnow className="w-10 h-10 text-white" />;
    if (code <= 99) return <CloudLightning className="w-10 h-10 text-purple-300" />;
    return <Sun className="w-10 h-10 text-yellow-300" />;
  };

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (payload.rainChance > 30) { // Show drop if rain chance > 30%
        return (
            <svg x={cx - 6} y={cy + 10} width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-200">
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
            </svg>
        );
    }
    return <circle cx={cx} cy={cy} r={3} fill="white" stroke="none" />;
  };

  const fetchItinerary = async () => {
    try {
      const res = await api.get('/api/itinerary');
      setItineraryItems(res.data);
      // Assuming API returns sorted items, pick the first one in the future
      const now = new Date();
      const upcoming = res.data.find(item => new Date(item.date + 'T' + item.time) > now);
      setNextItem(upcoming || (res.data.length > 0 ? res.data[res.data.length - 1] : null));
    } catch (error) {
      console.error("Error fetching itinerary:", error);
    }
  };

  const fetchExpenses = async () => {
      try {
          const res = await api.get('/api/expenses');
          const expenses = res.data;
          
          // Calculate total
          const total = expenses.reduce((acc, item) => acc + item.amount, 0);
          setTotalSpent(total);

          // Prepare chart data (Last 7 days or current week)
          const today = new Date();
          const start = startOfWeek(today, { weekStartsOn: 1 });
          const end = endOfWeek(today, { weekStartsOn: 1 });
          const days = eachDayOfInterval({ start, end });

          const data = days.map(day => {
              const dayExpenses = expenses.filter(e => isSameDay(new Date(e.date), day));
              const amount = dayExpenses.reduce((acc, e) => acc + e.amount, 0);
              return { name: format(day, 'EEE'), amount };
          });
          setChartData(data);

      } catch (error) {
          console.error("Error fetching expenses:", error);
      }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-4"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Hello, {user.display_name || user.username}! 👋</h2>
            <p className="text-gray-500 mt-2 text-base md:text-lg">Here's what's happening with your trip to <span className="text-blue-600 font-semibold">HangZhou and SuZhou</span>.</p>
        </div>
        <div 
            className="bg-white px-4 py-3 md:px-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow w-full md:w-auto justify-between md:justify-start"
            onDoubleClick={() => setIsEditingDate(true)}
            title="Double click to change trip date"
        >
            <div className="text-right">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{displayLabel}</p>
                {isEditingDate ? (
                    <input 
                        type="date" 
                        className="text-lg font-bold text-blue-600 border-none bg-transparent focus:ring-0 p-0 w-32 text-right"
                        value={format(tripDate, 'yyyy-MM-dd')}
                        onChange={async (e) => {
                            const newDate = new Date(e.target.value);
                            if (!isNaN(newDate.getTime())) {
                                setTripDate(newDate);
                                try {
                                    await api.put('/api/me', { trip_date: e.target.value });
                                } catch (error) {
                                    console.error("Error updating trip date:", error);
                                }
                            }
                        }}
                        onBlur={() => setIsEditingDate(false)}
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') setIsEditingDate(false);
                        }}
                    />
                ) : (
                    <p className="text-2xl font-bold text-blue-600">{displayCount}</p>
                )}
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Clock className="text-blue-600 w-6 h-6" />
            </div>
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weather Widget */}
        <motion.div variants={item} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden min-h-[200px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            
            {isSearching ? (
                <div className="relative z-10 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Change Location</h3>
                        <button onClick={() => setIsSearching(false)} className="p-1 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
                    </div>
                    <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search city..." 
                            className="flex-1 bg-white/20 border-none placeholder-blue-100 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-white/50 outline-none"
                            autoFocus
                        />
                        <button type="submit" className="bg-white/20 p-2 rounded-xl hover:bg-white/30"><Search className="w-5 h-5" /></button>
                    </form>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar max-h-[150px]">
                        {searchResults.map((result) => (
                            <button 
                                key={result.id}
                                onClick={() => selectLocation(result)}
                                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-sm"
                            >
                                <span className="font-bold block">{result.name}</span>
                                <span className="text-blue-100 text-xs">{result.admin1}, {result.country}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="cursor-pointer group" onClick={() => setIsSearching(true)}>
                            <div className="flex items-center gap-2">
                                <p className="text-blue-100 font-medium group-hover:text-white transition-colors">{location.name}</p>
                                <Search className="w-3 h-3 text-blue-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <h3 className="text-4xl font-bold mt-1">
                                {weather ? `${Math.round(weather.current.temperature_2m)}°C` : '--'}
                            </h3>
                        </div>
                        {weather && getWeatherIcon(weather.current.weather_code)}
                    </div>
                    
                    {weather && hourlyForecast.length > 0 && (
                        <div className="h-32 w-full mt-4 pt-4 border-t border-white/10 -ml-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={hourlyForecast}>
                                    <defs>
                                        <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#fff" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" tick={{fill: '#bfdbfe', fontSize: 10}} axisLine={false} tickLine={false} interval={0} />
                                    <Tooltip 
                                        contentStyle={{backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '8px', color: '#fff'}} 
                                        itemStyle={{color: '#fff'}} 
                                        labelStyle={{color: '#bfdbfe'}}
                                        formatter={(value, name) => [name === 'temp' ? `${value}°C` : value, name === 'temp' ? 'Temp' : name]}
                                    />
                                    <Area type="monotone" dataKey="temp" stroke="none" fill="url(#tempGradient)" tooltipType="none" />
                                    <Line type="monotone" dataKey="temp" stroke="#fff" strokeWidth={2} dot={<CustomDot />} activeDot={{r: 4, fill: 'white'}} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}
        </motion.div>

        {/* Budget Widget */}
        <motion.div variants={item} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/budget')}>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-xl">
                        <Wallet className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-semibold text-gray-700">Budget</span>
                </div>
                <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg text-sm">View All</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">¥{totalSpent.toFixed(2)}</h3>
            <p className="text-gray-400 text-sm mb-4">Total spent this week</p>
            <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>

        {/* Up Next Widget */}
        <motion.div variants={item} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-50 rounded-xl">
                        <CalendarIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="font-semibold text-gray-700">Up Next</span>
                </div>
                {nextItem ? (
                    <div>
                        <h4 className="text-xl font-bold text-gray-900 line-clamp-1">{nextItem.title}</h4>
                        <div className="flex items-center gap-2 text-gray-500 mt-2 text-sm">
                            <Clock className="w-4 h-4" />
                            <span>{nextItem.time}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>{format(new Date(nextItem.date), 'MMM d')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 mt-1 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span className="line-clamp-1">{nextItem.location || 'No location'}</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500">No upcoming activities.</p>
                )}
            </div>
            <Link to="/itinerary" className="w-full mt-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 group">
                View Full Itinerary <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
        </motion.div>
      </div>

      {/* Recent Activity / Map Placeholder */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[300px] flex flex-col">
            <h3 className="font-bold text-gray-800 mb-4">Trip Overview</h3>
            <div className="flex-grow rounded-2xl overflow-hidden h-[300px]">
                <Map 
                    center={[30.29365, 120.16142]} 
                    zoom={10} 
                    markers={itineraryItems
                        .filter(item => item.lat && item.lon)
                        .map(item => ({
                            position: [item.lat, item.lon],
                            title: item.title,
                            popup: `${item.title} - ${format(new Date(item.date), 'MMM d')}`
                        }))
                    }
                    connectPoints={true}
                />
            </div>
        </div>
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-xl">
            <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
            <div className="space-y-3">
                <Link to="/itinerary" className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-3 transition-colors backdrop-blur-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Add New Event</span>
                </Link>
                <Link to="/budget" className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-3 transition-colors backdrop-blur-sm">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <Wallet className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Log Expense</span>
                </Link>
                {/* <button className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-3 transition-colors backdrop-blur-sm">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Save Location</span>
                </button> */}
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
