import { useState, useEffect } from 'react';
import { Hotel, MapPin, Calendar, Key, Plus, X, Trash2, Star, Wifi, Coffee, Globe, Phone, Mail, DollarSign, ExternalLink, Edit2, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast, isFuture, isWithinInterval } from 'date-fns';
import { cn, API_BASE_URL, api } from '../lib/utils';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

const API_URL = `${API_BASE_URL}/api/stays`;

export default function Stays() {
  const [items, setItems] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const initialFormState = { 
    name: '', 
    address: '', 
    check_in: '', 
    check_out: '', 
    booking_ref: '', 
    notes: '',
    price: '',
    website: '',
    phone: '',
    email: ''
  };
  
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/api/stays');
      // Sort by check-in date
      const sorted = res.data.sort((a, b) => new Date(a.check_in) - new Date(b.check_in));
      setItems(sorted);
    } catch (error) {
      console.error("Error fetching stays:", error);
    }
  };

  const handleOpenAdd = () => {
    setFormData(initialFormState);
    setIsEditMode(false);
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setFormData({
      name: item.name || '',
      address: item.address || '',
      check_in: item.check_in || '',
      check_out: item.check_out || '',
      booking_ref: item.booking_ref || '',
      notes: item.notes || '',
      price: item.price || '',
      website: item.website || '',
      phone: item.phone || '',
      email: item.email || ''
    });
    setIsEditMode(true);
    setEditingId(item.id);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await api.put(`/api/stays/${editingId}`, formData);
      } else {
        await api.post('/api/stays', formData);
      }
      setIsFormOpen(false);
      fetchItems();
    } catch (error) {
      console.error("Error saving stay:", error);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/api/stays/${itemToDelete.id}`);
      fetchItems();
    } catch (error) {
      console.error("Error deleting stay:", error);
    }
  };

  const getStatus = (start, end) => {
    if (!start || !end) return null;
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isWithinInterval(now, { start: startDate, end: endDate })) {
      return { label: 'Current Stay', color: 'bg-green-100 text-green-700 border-green-200' };
    } else if (isFuture(startDate)) {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    } else {
      return { label: 'Past', color: 'bg-gray-100 text-gray-600 border-gray-200' };
    }
  };

  return (
    <div className="flex flex-col h-auto lg:h-full">
      <div className="flex justify-between items-center mb-6 lg:mb-8 pt-2">
        <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Accommodations</h2>
            <p className="text-sm md:text-base text-gray-500">Manage your hotels, airbnbs, and stays</p>
        </div>
        <button 
            onClick={handleOpenAdd} 
            className="bg-gray-900 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-xl hover:bg-gray-800 flex items-center gap-2 shadow-lg shadow-gray-900/20 transition-all hover:scale-105 text-sm md:text-base"
        >
            <Plus className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden md:inline">Add Stay</span><span className="md:hidden">Add</span>
        </button>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={isEditMode ? "Edit Accommodation" : "Add Accommodation"}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Hotel / Place Name</label>
                <div className="relative">
                    <Hotel className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="e.g. Grand Budapest Hotel" 
                        className="w-full bg-gray-50 border-0 pl-12 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        required 
                    />
                </div>
            </div>
            
            <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="123 Main St, City" 
                        className="w-full bg-gray-50 border-0 pl-12 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
                        value={formData.address} 
                        onChange={e => setFormData({...formData, address: e.target.value})} 
                    />
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Check-in</label>
                <input 
                    type="datetime-local" 
                    className="w-full bg-gray-50 border-0 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
                    value={formData.check_in} 
                    onChange={e => setFormData({...formData, check_in: e.target.value})} 
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Check-out</label>
                <input 
                    type="datetime-local" 
                    className="w-full bg-gray-50 border-0 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
                    value={formData.check_out} 
                    onChange={e => setFormData({...formData, check_out: e.target.value})} 
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cost / Price</label>
                <div className="relative">
                    <DollarSign className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        className="w-full bg-gray-50 border-0 pl-12 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
                        value={formData.price} 
                        onChange={e => setFormData({...formData, price: e.target.value})} 
                    />
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Booking Reference</label>
                <div className="relative">
                    <Key className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Booking ID" 
                        className="w-full bg-gray-50 border-0 pl-12 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
                        value={formData.booking_ref} 
                        onChange={e => setFormData({...formData, booking_ref: e.target.value})} 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <div className="relative">
                    <Globe className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input 
                        type="url" 
                        placeholder="https://..." 
                        className="w-full bg-gray-50 border-0 pl-12 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
                        value={formData.website} 
                        onChange={e => setFormData({...formData, website: e.target.value})} 
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input 
                        type="tel" 
                        placeholder="+1 234 567 890" 
                        className="w-full bg-gray-50 border-0 pl-12 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                    />
                </div>
            </div>

            <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input 
                        type="email" 
                        placeholder="hotel@example.com" 
                        className="w-full bg-gray-50 border-0 pl-12 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                    />
                </div>
            </div>
            
            <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea 
                    placeholder="Gate codes, wifi passwords, special instructions..." 
                    className="w-full bg-gray-50 border-0 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all h-32 resize-none" 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                ></textarea>
            </div>
            
            <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 font-medium transition-all transform hover:scale-105">
                    {isEditMode ? 'Save Changes' : 'Add Stay'}
                </button>
            </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
        {items.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center text-gray-400 py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <Hotel className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg">No stays added yet</p>
                <button onClick={handleOpenAdd} className="text-blue-600 font-medium mt-2 hover:underline">Add your first stay</button>
            </div>
        ) : (
            items.map((item, index) => {
                const status = getStatus(item.check_in, item.check_out);
                return (
                <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                    <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-600 relative p-8 text-white flex flex-col justify-between shrink-0">
                        <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex gap-2">
                                <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl">
                                    <Hotel className="w-8 h-8 text-white" />
                                </div>
                                {status && (
                                    <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center border backdrop-blur-md", status.color.replace('bg-', 'bg-white/90 ').replace('text-', 'text-'))}>
                                        {status.label}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleOpenEdit(item)} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg backdrop-blur-md transition-colors text-white/80 hover:text-white">
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDeleteClick(item)} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg backdrop-blur-md transition-colors text-white/80 hover:text-white">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-1 truncate">{item.name}</h3>
                            <div className="flex items-center gap-2 text-blue-100 text-sm">
                                <MapPin className="w-4 h-4 shrink-0" />
                                <span className="truncate">{item.address}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-8 flex-grow flex flex-col">
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Check In</p>
                                <div className="flex items-center gap-3 text-gray-800">
                                    <Calendar className="w-5 h-5 text-blue-500" />
                                    <div>
                                        <p className="font-bold">{item.check_in ? format(new Date(item.check_in), 'MMM dd, yyyy') : 'TBD'}</p>
                                        <p className="text-sm text-gray-500">{item.check_in ? format(new Date(item.check_in), 'h:mm a') : '--:--'}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Check Out</p>
                                <div className="flex items-center gap-3 text-gray-800">
                                    <Calendar className="w-5 h-5 text-blue-500" />
                                    <div>
                                        <p className="font-bold">{item.check_out ? format(new Date(item.check_out), 'MMM dd, yyyy') : 'TBD'}</p>
                                        <p className="text-sm text-gray-500">{item.check_out ? format(new Date(item.check_out), 'h:mm a') : '--:--'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            {item.booking_ref && (
                                <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <Key className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">Booking Reference</p>
                                            <p className="font-mono font-bold text-gray-800 tracking-wide text-sm">{item.booking_ref}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {item.price && (
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <DollarSign className="w-4 h-4 text-green-500" />
                                    <span>Cost: <span className="font-semibold text-gray-900">${Number(item.price).toFixed(2)}</span></span>
                                </div>
                            )}

                            {(item.phone || item.email || item.website) && (
                                <div className="flex flex-wrap gap-3 pt-2">
                                    {item.website && (
                                        <a href={item.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                                            <Globe className="w-3.5 h-3.5" /> Website
                                        </a>
                                    )}
                                    {item.phone && (
                                        <a href={`tel:${item.phone}`} className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                                            <Phone className="w-3.5 h-3.5" /> Call
                                        </a>
                                    )}
                                    {item.email && (
                                        <a href={`mailto:${item.email}`} className="flex items-center gap-1.5 text-xs font-medium text-purple-600 bg-purple-50 px-2.5 py-1.5 rounded-lg hover:bg-purple-100 transition-colors">
                                            <Mail className="w-3.5 h-3.5" /> Email
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {item.notes && (
                            <div className="mb-6 flex-grow">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes</p>
                                <p className="text-gray-600 text-sm leading-relaxed bg-yellow-50/50 p-4 rounded-xl border border-yellow-100/50 whitespace-pre-wrap">
                                    {item.notes}
                                </p>
                            </div>
                        )}
                        
                        <div className="mt-auto pt-6 border-t border-gray-100 flex gap-3 justify-between items-center">
                            <div className="flex gap-2">
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                                    <Wifi className="w-3.5 h-3.5" /> Wifi
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                                    <Coffee className="w-3.5 h-3.5" /> Breakfast
                                </div>
                            </div>
                            
                            {item.address && (
                                <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider hover:underline"
                                >
                                    <MapIcon className="w-4 h-4" /> Map
                                </a>
                            )}
                        </div>
                    </div>
                </motion.div>
                );
            })
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Accommodation"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
