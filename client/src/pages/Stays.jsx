import { Hotel, MapPin, Calendar, Key, Plus, Trash2, Star, Wifi, Coffee, Globe, Phone, Mail, DollarSign, Edit2, Map as MapIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isFuture, isWithinInterval } from 'date-fns';
import { cn } from '../lib/utils';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import LocationInput from '../components/LocationInput';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Card from '../components/Card';
import { useResource } from '../hooks/useResource';

export default function Stays() {
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
  } = useResource('/api/stays', initialFormState);

  const sortedItems = [...items].sort((a, b) => new Date(a.check_in) - new Date(b.check_in));

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
      <PageHeader 
        title="Accommodations" 
        subtitle="Manage your hotels, airbnbs, and stays"
        action={
            <Button onClick={openAddForm} icon={Plus}>
                Add Stay
            </Button>
        }
      />

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingId ? "Edit Accommodation" : "Add Accommodation"}
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
                <LocationInput 
                    value={formData.address}
                    onChange={(val) => setFormData({...formData, address: val})}
                    onSelect={(result) => setFormData({...formData, address: result.display_name})}
                    placeholder="123 Main St, City"
                    className="pl-12 p-3.5"
                />
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
                <Button type="button" variant="ghost" onClick={closeForm}>Cancel</Button>
                <Button type="submit">
                    {editingId ? 'Save Changes' : 'Add Stay'}
                </Button>
            </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
        {sortedItems.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center text-gray-400 py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <Hotel className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg">No stays added yet</p>
                <Button variant="ghost" onClick={openAddForm} className="text-blue-600 mt-2 hover:bg-blue-50">Add your first stay</Button>
            </div>
        ) : (
            sortedItems.map((item, index) => {
                const status = getStatus(item.check_in, item.check_out);
                return (
                <Card 
                    key={item.id}
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-0 overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col"
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
                                <Button onClick={() => openEditForm(item)} variant="ghost" size="icon" className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border-0">
                                    <Edit2 className="w-5 h-5" />
                                </Button>
                                <Button onClick={() => openDeleteConfirm(item)} variant="ghost" size="icon" className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border-0">
                                    <Trash2 className="w-5 h-5" />
                                </Button>
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
                                        <a href={item.website} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="sm" className="text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100 h-8 text-xs">
                                                <Globe className="w-3.5 h-3.5 mr-1.5" /> Website
                                            </Button>
                                        </a>
                                    )}
                                    {item.phone && (
                                        <a href={`tel:${item.phone}`}>
                                            <Button variant="outline" size="sm" className="text-green-600 bg-green-50 border-green-100 hover:bg-green-100 h-8 text-xs">
                                                <Phone className="w-3.5 h-3.5 mr-1.5" /> Call
                                            </Button>
                                        </a>
                                    )}
                                    {item.email && (
                                        <a href={`mailto:${item.email}`}>
                                            <Button variant="outline" size="sm" className="text-purple-600 bg-purple-50 border-purple-100 hover:bg-purple-100 h-8 text-xs">
                                                <Mail className="w-3.5 h-3.5 mr-1.5" /> Email
                                            </Button>
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
                                >
                                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 text-xs font-bold uppercase tracking-wider">
                                        <MapIcon className="w-4 h-4 mr-2" /> Map
                                    </Button>
                                </a>
                            )}
                        </div>
                    </div>
                </Card>
                );
            })
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Accommodation"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
