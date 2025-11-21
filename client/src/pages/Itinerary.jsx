import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Calendar, Clock, MapPin, Plus, Trash2, Plane, Utensils, Activity, MoreHorizontal, X, Pencil, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn, API_BASE_URL, api } from '../lib/utils';
import Map from '../components/Map';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

const API_URL = `${API_BASE_URL}/api/itinerary`;

export default function Itinerary() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ title: '', date: '', time: '', location: '', description: '', type: 'activity', lat: '', lon: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef(null);
  const searchCache = useRef({});

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/api/itinerary');
      setItems(res.data);
    } catch (error) {
      console.error("Error fetching itinerary:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/itinerary/${editingId}`, newItem);
      } else {
        await api.post('/api/itinerary', newItem);
      }
      resetForm();
      fetchItems();
    } catch (error) {
      console.error("Error saving itinerary item:", error);
    }
  };

  const handleEdit = (item) => {
    setNewItem(item);
    setEditingId(item.id);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/api/itinerary/${itemToDelete.id}`);
      if (selectedItem?.id === itemToDelete.id) setSelectedItem(null);
      fetchItems();
    } catch (error) {
      console.error("Error deleting itinerary item:", error);
    }
  };

  const handleLocationChange = (e) => {
      const value = e.target.value;
      setNewItem({...newItem, location: value});
      
      if (searchTimeout.current) {
          clearTimeout(searchTimeout.current);
      }

      if (value.length > 2) {
          setIsSearching(true);
          searchTimeout.current = setTimeout(async () => {
              if (searchCache.current[value]) {
                  setSearchResults(searchCache.current[value]);
                  setShowResults(true);
                  setIsSearching(false);
                  return;
              }

              try {
                  // Use Nominatim for better POI search
                  const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${value}&limit=5`);
                  const results = res.data || [];
                  searchCache.current[value] = results;
                  setSearchResults(results);
                  setShowResults(true);
              } catch (error) {
                  console.error("Error searching location:", error);
              } finally {
                  setIsSearching(false);
              }
          }, 800);
      } else {
          setSearchResults([]);
          setShowResults(false);
          setIsSearching(false);
      }
  };

  const selectLocation = (result) => {
      setNewItem({
          ...newItem,
          location: result.display_name,
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon)
      });
      setShowResults(false);
  };

  const resetForm = () => {
      setNewItem({ title: '', date: '', time: '', location: '', description: '', type: 'activity', lat: '', lon: '' });
      setEditingId(null);
      setIsFormOpen(false);
  };

  // Group items by date
  const groupedItems = items.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedItems).sort();

  const getIcon = (type) => {
      switch(type) {
          case 'flight': return <Plane className="w-5 h-5" />;
          case 'food': return <Utensils className="w-5 h-5" />;
          case 'activity': return <Activity className="w-5 h-5" />;
          default: return <MoreHorizontal className="w-5 h-5" />;
      }
  };

  const getTypeColor = (type) => {
      switch(type) {
          case 'flight': return 'bg-blue-100 text-blue-600';
          case 'food': return 'bg-orange-100 text-orange-600';
          case 'activity': return 'bg-green-100 text-green-600';
          default: return 'bg-gray-100 text-gray-600';
      }
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-full gap-6">
      {/* Timeline Section */}
      <div className="flex-1 lg:overflow-y-auto pr-2 pb-4 lg:pb-0">
        <div className="flex justify-between items-center mb-8 py-4">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Itinerary</h2>
                <p className="text-sm md:text-base text-gray-500">Your journey timeline</p>
            </div>
            <button 
                onClick={() => {
                    if (isFormOpen) resetForm();
                    else setIsFormOpen(true);
                }} 
                className="bg-gray-900 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl hover:bg-gray-800 flex items-center gap-2 transition-all shadow-lg shadow-gray-900/20 text-sm md:text-base"
            >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                Add Event
            </button>
        </div>

        <Modal
            isOpen={isFormOpen}
            onClose={resetForm}
            title={editingId ? 'Edit Event' : 'New Event'}
        >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input type="text" placeholder="e.g., Visit Eiffel Tower" className="w-full bg-gray-50 border-0 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} required />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input type="date" className="w-full bg-gray-50 border-0 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" value={newItem.date} onChange={e => setNewItem({...newItem, date: e.target.value})} required />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input type="time" className="w-full bg-gray-50 border-0 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" value={newItem.time} onChange={e => setNewItem({...newItem, time: e.target.value})} required />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search for a place..." 
                            className="w-full bg-gray-50 border-0 p-3 pl-10 pr-10 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
                            value={newItem.location} 
                            onChange={handleLocationChange}
                            onFocus={() => newItem.location.length > 2 && setShowResults(true)}
                            onBlur={() => setTimeout(() => setShowResults(false), 200)}
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-3.5">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                        )}
                        {showResults && searchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                {searchResults.map((result, index) => (
                                    <button 
                                        key={index}
                                        type="button"
                                        onClick={() => selectLocation(result)}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"
                                    >
                                        <span className="font-bold block truncate">{result.display_name.split(',')[0]}</span>
                                        <span className="text-gray-500 text-xs truncate block">{result.display_name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Latitude (Optional)</label>
                        <input type="number" step="any" placeholder="e.g. 30.29" className="w-full bg-gray-50 border-0 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" value={newItem.lat} onChange={e => setNewItem({...newItem, lat: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Longitude (Optional)</label>
                        <input type="number" step="any" placeholder="e.g. 120.16" className="w-full bg-gray-50 border-0 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" value={newItem.lon} onChange={e => setNewItem({...newItem, lon: e.target.value})} />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select className="w-full bg-gray-50 border-0 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})}>
                        <option value="activity">Activity</option>
                        <option value="flight">Flight</option>
                        <option value="food">Food</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea placeholder="Details about the activity..." className="w-full bg-gray-50 border-0 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all h-24 resize-none" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})}></textarea>
                </div>
                
                <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-2">
                    <button type="button" onClick={resetForm} className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white px-8 py-2.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 font-medium transition-all transform hover:scale-105">{editingId ? 'Update' : 'Save'}</button>
                </div>
            </form>
        </Modal>

        <div className="space-y-10 pb-10">
            {sortedDates.map((date, dateIndex) => (
                <motion.div 
                    key={date}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: dateIndex * 0.1 }}
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 font-bold text-gray-800 flex items-center gap-2 text-sm md:text-base">
                            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                            {format(new Date(date), 'EEEE, MMMM do')}
                        </div>
                        <div className="h-px bg-gray-200 flex-grow"></div>
                    </div>
                    
                    <div className="space-y-6 pl-4 border-l-2 border-blue-100 ml-4 relative">
                        {groupedItems[date].map((item, index) => (
                            <motion.div 
                                key={item.id}
                                layoutId={`card-${item.id}`}
                                onClick={() => setSelectedItem(item)}
                                className={cn(
                                    "relative bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer transition-all hover:shadow-lg group overflow-hidden",
                                    selectedItem?.id === item.id ? "ring-2 ring-blue-500 shadow-md" : ""
                                )}
                                whileHover={{ scale: 1.02, y: -2 }}
                            >
                                <div className={cn("absolute -left-[25px] top-6 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10", getTypeColor(item.type).replace('text-', 'bg-').replace('100', '500'))}></div>
                                
                                {/* Decorative background element */}
                                <div className={cn("absolute top-0 right-0 w-24 h-24 opacity-5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150", getTypeColor(item.type).replace('text-', 'bg-').replace('100', '500'))}></div>

                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-xs font-bold font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">{item.time}</span>
                                            <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5", getTypeColor(item.type))}>
                                                {getIcon(item.type)}
                                                {item.type}
                                            </span>
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-900 leading-tight mb-1">{item.title}</h4>
                                        {item.location && (
                                            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" /> {item.location}
                                            </p>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                                        <ChevronRight className={cn("w-4 h-4 text-gray-400 transition-all", selectedItem?.id === item.id ? "rotate-90 text-blue-500" : "group-hover:text-blue-500 group-hover:translate-x-0.5")} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            ))}
        </div>
      </div>

      {/* Details Panel (Right Side - Desktop) */}
      <AnimatePresence mode="wait">
        {selectedItem ? (
            <motion.div 
                key="details-desktop"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-96 bg-white rounded-3xl shadow-xl border border-gray-100 p-8 h-fit sticky top-4 hidden lg:block"
            >
                <div className="flex justify-between items-start mb-6">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", getTypeColor(selectedItem.type))}>
                        {getIcon(selectedItem.type)}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleEdit(selectedItem)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-blue-600 transition-colors"><Pencil className="w-5 h-5" /></button>
                        <button onClick={() => handleDeleteClick(selectedItem)} className="p-2 hover:bg-red-50 rounded-xl text-gray-500 hover:text-red-600 transition-colors"><Trash2 className="w-5 h-5" /></button>
                        <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedItem.title}</h3>
                
                <div className="space-y-4 mt-6">
                    <div className="flex items-center gap-3 text-gray-600">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <span>{format(new Date(selectedItem.date), 'MMMM do, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span>{selectedItem.time}</span>
                    </div>
                    {selectedItem.location && (
                        <div className="flex items-center gap-3 text-gray-600">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <span>{selectedItem.location}</span>
                        </div>
                    )}
                </div>

                {selectedItem.description && (
                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Notes</h4>
                        <p className="text-gray-600 leading-relaxed">{selectedItem.description}</p>
                    </div>
                )}

                <div className="mt-8 pt-8 border-t border-gray-100">
                    <div className="h-48 bg-gray-100 rounded-xl overflow-hidden">
                        <Map 
                            center={selectedItem.lat && selectedItem.lon ? [selectedItem.lat, selectedItem.lon] : [30.29365, 120.16142]} 
                            zoom={12} 
                            markers={selectedItem.lat && selectedItem.lon ? [{ position: [selectedItem.lat, selectedItem.lon], popup: selectedItem.title }] : []}
                        />
                    </div>
                </div>
            </motion.div>
        ) : (
            <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-96 hidden lg:flex items-center justify-center text-gray-400 text-center p-8 border-2 border-dashed border-gray-200 rounded-3xl h-64 self-start sticky top-4"
            >
                <div>
                    <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>Select an event to view details</p>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile View (Modal/Sheet) */}
      {createPortal(
        <AnimatePresence>
            {selectedItem && (
                <>
                    <motion.div
                        key="details-mobile"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-x-0 bottom-0 z-[9999] bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 lg:hidden max-h-[85vh] overflow-y-auto pb-safe"
                    >
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                        
                        <div className="flex justify-between items-start mb-6">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", getTypeColor(selectedItem.type))}>
                                {getIcon(selectedItem.type)}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(selectedItem)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-blue-600 transition-colors"><Pencil className="w-5 h-5" /></button>
                                <button onClick={() => handleDeleteClick(selectedItem)} className="p-2 hover:bg-red-50 rounded-xl text-gray-500 hover:text-red-600 transition-colors"><Trash2 className="w-5 h-5" /></button>
                                <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedItem.title}</h3>
                        
                        <div className="space-y-4 mt-6">
                            <div className="flex items-center gap-3 text-gray-600">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <span>{format(new Date(selectedItem.date), 'MMMM do, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600">
                                <Clock className="w-5 h-5 text-gray-400" />
                                <span>{selectedItem.time}</span>
                            </div>
                            {selectedItem.location && (
                                <div className="flex items-center gap-3 text-gray-600">
                                    <MapPin className="w-5 h-5 text-gray-400" />
                                    <span>{selectedItem.location}</span>
                                </div>
                            )}
                        </div>

                        {selectedItem.description && (
                            <div className="mt-8 pt-8 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Notes</h4>
                                <p className="text-gray-600 leading-relaxed">{selectedItem.description}</p>
                            </div>
                        )}

                        <div className="mt-8 pt-8 border-t border-gray-100 mb-20">
                            <div className="h-48 bg-gray-100 rounded-xl overflow-hidden">
                                <Map 
                                    center={selectedItem.lat && selectedItem.lon ? [selectedItem.lat, selectedItem.lon] : [30.29365, 120.16142]} 
                                    zoom={12} 
                                    markers={selectedItem.lat && selectedItem.lon ? [{ position: [selectedItem.lat, selectedItem.lon], popup: selectedItem.title }] : []}
                                />
                            </div>
                        </div>
                    </motion.div>
                    {/* Backdrop for mobile */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedItem(null)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] lg:hidden"
                    />
                </>
            )}
        </AnimatePresence>,
        document.body
      )}

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}
