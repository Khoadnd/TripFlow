import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, MapPin, Plus, Trash2, Plane, Utensils, Activity, MoreHorizontal, X, Pencil, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import Map from '../components/Map';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import LocationInput from '../components/LocationInput';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Card from '../components/Card';
import { useResource } from '../hooks/useResource';

export default function Itinerary() {
  const initialFormState = { title: '', date: '', time: '', location: '', description: '', type: 'activity', lat: '', lon: '' };
  
  const {
    items,
    formData,
    setFormData,
    isFormOpen,
    openAddForm,
    openEditForm,
    closeForm,
    isDeleteOpen,
    openDeleteConfirm,
    closeDeleteConfirm,
    itemToDelete,
    handleDelete,
    handleSubmit,
    editingId
  } = useResource('/api/itinerary', initialFormState);

  const [selectedItem, setSelectedItem] = useState(null);

  // Clear selected item if it gets deleted
  useEffect(() => {
    if (selectedItem && !items.find(i => i.id === selectedItem.id)) {
      setSelectedItem(null);
    }
  }, [items, selectedItem]);

  const handleLocationSelect = (result) => {
      setFormData({
          ...formData,
          location: result.display_name,
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon)
      });
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
        <PageHeader 
            title="Itinerary" 
            subtitle="Your journey timeline"
            action={
                <Button onClick={openAddForm} icon={Plus}>
                    Add Event
                </Button>
            }
            className="mb-8"
        />

        <Modal
            isOpen={isFormOpen}
            onClose={closeForm}
            title={editingId ? 'Edit Event' : 'New Event'}
        >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input type="text" placeholder="e.g., Visit Eiffel Tower" className="w-full bg-gray-50 border-0 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input type="date" className="w-full bg-gray-50 border-0 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input type="time" className="w-full bg-gray-50 border-0 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} required />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <LocationInput 
                        value={formData.location}
                        onChange={(val) => setFormData({...formData, location: val})}
                        onSelect={handleLocationSelect}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Latitude (Optional)</label>
                        <input type="number" step="any" placeholder="e.g. 30.29" className="w-full bg-gray-50 border-0 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Longitude (Optional)</label>
                        <input type="number" step="any" placeholder="e.g. 120.16" className="w-full bg-gray-50 border-0 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" value={formData.lon} onChange={e => setFormData({...formData, lon: e.target.value})} />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select className="w-full bg-gray-50 border-0 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                        <option value="activity">Activity</option>
                        <option value="flight">Flight</option>
                        <option value="food">Food</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea placeholder="Details about the activity..." className="w-full bg-gray-50 border-0 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all h-24 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                </div>
                
                <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-2">
                    <Button type="button" variant="ghost" onClick={closeForm}>Cancel</Button>
                    <Button type="submit">
                        {editingId ? 'Update' : 'Save'}
                    </Button>
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
                            <Card 
                                key={item.id}
                                layoutId={`card-${item.id}`}
                                onClick={() => setSelectedItem(item)}
                                className={cn(
                                    "relative p-5 cursor-pointer transition-all hover:shadow-lg group overflow-hidden",
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
                            </Card>
                        ))}
                    </div>
                </motion.div>
            ))}
        </div>
      </div>

      {/* Details Panel (Right Side - Desktop) */}
      <AnimatePresence mode="wait">
        {selectedItem ? (
            <Card 
                key="details-desktop"
                animate={{ opacity: 1, x: 0 }}
                initial={{ opacity: 0, x: 20 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-96 p-8 h-fit sticky top-4 hidden lg:block"
            >
                <div className="flex justify-between items-start mb-6">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", getTypeColor(selectedItem.type))}>
                        {getIcon(selectedItem.type)}
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => openEditForm(selectedItem)} variant="ghost" size="icon" className="text-gray-500 hover:text-blue-600">
                            <Pencil className="w-5 h-5" />
                        </Button>
                        <Button onClick={() => openDeleteConfirm(selectedItem)} variant="ghost" size="icon" className="text-gray-500 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-5 h-5" />
                        </Button>
                        <Button onClick={() => setSelectedItem(null)} variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </Button>
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
            </Card>
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
                                <Button onClick={() => openEditForm(selectedItem)} variant="ghost" size="icon" className="text-gray-500 hover:text-blue-600">
                                    <Pencil className="w-5 h-5" />
                                </Button>
                                <Button onClick={() => openDeleteConfirm(selectedItem)} variant="ghost" size="icon" className="text-gray-500 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                                <Button onClick={() => setSelectedItem(null)} variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </Button>
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
        onClose={closeDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}
