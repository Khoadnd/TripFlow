import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Image as ImageIcon, File, Trash2, Eye, Upload, X, Search, Filter, Grid, List as ListIcon, FolderOpen, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, API_BASE_URL, api } from '../lib/utils';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import Button from '../components/Button';
import Card from '../components/Card';
import { useResource } from '../hooks/useResource';

const UPLOAD_URL = `${API_BASE_URL}/uploads`;

const CATEGORIES = [
    { id: 'all', label: 'All Files', icon: FolderOpen },
    { id: 'ticket', label: 'Tickets', icon: FileText },
    { id: 'passport', label: 'Passports', icon: File },
    { id: 'booking', label: 'Bookings', icon: FileText },
    { id: 'general', label: 'General', icon: File },
];

export default function Documents() {
  const {
    items,
    isFormOpen,
    openAddForm,
    closeForm,
    isDeleteOpen,
    openDeleteConfirm,
    closeDeleteConfirm,
    itemToDelete,
    handleDelete,
    fetchItems
  } = useResource('/api/documents');

  const [filteredItems, setFilteredItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [file, setFile] = useState(null);
  const [type, setType] = useState('general');
  const [previewItem, setPreviewItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [storage, setStorage] = useState({ used: 0, total: 1024 * 1024 * 1024, percent: 0 }); // Default 1GB

  useEffect(() => {
    fetchStorage();
  }, []);

  useEffect(() => {
      fetchStorage();
  }, [items]);

  useEffect(() => {
      let result = items;
      if (activeCategory !== 'all') {
          result = result.filter(item => item.type === activeCategory);
      }
      if (searchQuery) {
          result = result.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      setFilteredItems(result);
  }, [items, activeCategory, searchQuery]);

  const fetchStorage = async () => {
    try {
      const res = await api.get('/api/storage');
      setStorage(res.data);
    } catch (error) {
      console.error("Error fetching storage:", error);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      await api.post('/api/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      closeForm();
      fetchItems();
    } catch (error) {
      console.error("Error uploading document:", error);
    }
  };

  const handleOpenUpload = () => {
      openAddForm();
      setFile(null);
      setType('general');
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const getFileIcon = (filename) => {
      const ext = filename.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon className="w-8 h-8 text-purple-500" />;
      if (['pdf'].includes(ext)) return <FileText className="w-8 h-8 text-red-500" />;
      return <File className="w-8 h-8 text-gray-400" />;
  };

  const isImage = (filename) => {
      const ext = filename.split('.').pop().toLowerCase();
      return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  return (
    <div className="h-auto lg:h-full flex flex-col lg:flex-row gap-6 pb-4 lg:pb-0">
      {/* Sidebar */}
      <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-4 lg:gap-6">
          {/* Mobile Header */}
          <div className="lg:hidden flex justify-between items-center pt-2">
              <div>
                  <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
                  <p className="text-sm text-gray-500">Manage your files</p>
              </div>
              <Button onClick={handleOpenUpload} size="icon">
                  <Upload className="w-5 h-5" />
              </Button>
          </div>

          <Card className="hidden lg:block p-4">
              <Button onClick={handleOpenUpload} className="w-full mb-6">
                  <Upload className="w-5 h-5" /> Upload File
              </Button>
              
              <div className="space-y-1">
                  {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                            activeCategory === cat.id 
                                ? "bg-blue-50 text-blue-700 shadow-sm" 
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                          <cat.icon className={cn("w-5 h-5", activeCategory === cat.id ? "text-blue-600" : "text-gray-400")} />
                          {cat.label}
                          {activeCategory === cat.id && (
                              <span className="ml-auto bg-blue-200 text-blue-800 text-xs py-0.5 px-2 rounded-full">
                                  {cat.id === 'all' ? items.length : items.filter(i => i.type === cat.id).length}
                              </span>
                          )}
                      </button>
                  ))}
              </div>
          </Card>

          {/* Mobile Categories */}
          <div className="lg:hidden overflow-x-auto pb-2 -mx-4 px-4 flex gap-2 no-scrollbar">
               {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                        "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-medium border",
                        activeCategory === cat.id 
                            ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                            : "bg-white text-gray-600 border-gray-200"
                    )}
                  >
                      <cat.icon className={cn("w-4 h-4", activeCategory === cat.id ? "text-white" : "text-gray-400")} />
                      {cat.label}
                  </button>
              ))}
          </div>
          
          <div className="hidden lg:block bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg">
              <h3 className="font-bold text-lg mb-2">Storage</h3>
              <div className="w-full bg-white/20 rounded-full h-2 mb-4">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(storage.percent, 100)}%` }}
                  ></div>
              </div>
              <p className="text-sm text-white/80">{formatBytes(storage.used)} used of {formatBytes(storage.total)}</p>
          </div>
      </div>

      {/* Main Content */}
      <Card className="flex-grow flex flex-col lg:overflow-hidden min-h-[500px] p-0">
          {/* Header */}
          <div className="p-4 lg:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search files..." 
                    className="w-full bg-gray-50 border-0 pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
              </div>
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl self-end sm:self-auto">
                  <Button 
                    onClick={() => setViewMode('grid')}
                    variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                    size="icon"
                    className={cn(viewMode === 'grid' ? "bg-white shadow-sm text-blue-600 hover:bg-white" : "text-gray-400 hover:text-gray-600")}
                  >
                      <Grid className="w-5 h-5" />
                  </Button>
                  <Button 
                    onClick={() => setViewMode('list')}
                    variant={viewMode === 'list' ? 'primary' : 'ghost'}
                    size="icon"
                    className={cn(viewMode === 'list' ? "bg-white shadow-sm text-blue-600 hover:bg-white" : "text-gray-400 hover:text-gray-600")}
                  >
                      <ListIcon className="w-5 h-5" />
                  </Button>
              </div>
          </div>

          {/* File Grid/List */}
          <div className="flex-grow lg:overflow-y-auto p-4 lg:p-6">
              {filteredItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <FolderOpen className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-lg">No files found</p>
                  </div>
              ) : (
                  <div className={cn(
                      "grid gap-6",
                      viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
                  )}>
                      {filteredItems.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                                "group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer",
                                viewMode === 'list' ? "flex items-center p-4 gap-4" : ""
                            )}
                            onClick={() => setPreviewItem(item)}
                          >
                              <div className={cn(
                                  "bg-gray-50 flex items-center justify-center overflow-hidden",
                                  viewMode === 'grid' ? "h-48 w-full" : "h-16 w-16 rounded-xl flex-shrink-0"
                              )}>
                                  {isImage(item.path) ? (
                                      <img src={`${UPLOAD_URL}/${item.path}`} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                  ) : item.thumbnail_path ? (
                                      <img src={`${UPLOAD_URL}/${item.thumbnail_path}`} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                  ) : (
                                      getFileIcon(item.path)
                                  )}
                              </div>
                              
                              <div className={cn("flex-grow", viewMode === 'grid' ? "p-4" : "")}>
                                  <div className="flex justify-between items-start">
                                      <div className="overflow-hidden">
                                          <h4 className="font-bold text-gray-800 truncate mb-1" title={item.name}>{item.name}</h4>
                                          <p className="text-xs text-gray-500 flex items-center gap-2">
                                              <span className="uppercase bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider">{item.type}</span>
                                              <span>{new Date(item.upload_date).toLocaleDateString()}</span>
                                          </p>
                                      </div>
                                      <Button 
                                        onClick={(e) => { e.stopPropagation(); openDeleteConfirm(item); }}
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100"
                                      >
                                          <Trash2 className="w-4 h-4" />
                                      </Button>
                                  </div>
                              </div>
                          </motion.div>
                      ))}
                  </div>
              )}
          </div>
      </Card>

      {/* Upload Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title="Upload Document"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpload} className="space-y-6">
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer relative">
                <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={e => setFile(e.target.files[0])}
                    required 
                />
                <div className="pointer-events-none">
                    {file ? (
                        <div className="flex flex-col items-center text-blue-600">
                            <FileText className="w-12 h-12 mb-2" />
                            <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-gray-400">
                            <Upload className="w-12 h-12 mb-2" />
                            <p className="font-medium">Click or drag file to upload</p>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                <select 
                    className="w-full bg-gray-50 border-0 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                    value={type} 
                    onChange={e => setType(e.target.value)}
                >
                    <option value="general">General</option>
                    <option value="ticket">Ticket</option>
                    <option value="passport">Passport</option>
                    <option value="booking">Booking</option>
                </select>
            </div>

            <Button type="submit" className="w-full">
                Upload File
            </Button>
        </form>
      </Modal>

      {/* Preview Modal */}
      {createPortal(
      <AnimatePresence>
      {previewItem && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl" 
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b flex justify-between items-center bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            {isImage(previewItem.path) ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 truncate max-w-md">{previewItem.name}</h3>
                            <p className="text-xs text-gray-500">{new Date(previewItem.upload_date).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <a 
                            href={`${UPLOAD_URL}/${previewItem.path}`} 
                            download 
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <Upload className="w-4 h-4 rotate-180" /> Download
                        </a>
                        <Button onClick={() => setPreviewItem(null)} variant="ghost" size="icon">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
                <div className="flex-grow overflow-auto bg-gray-100 p-8 flex items-center justify-center">
                    {isImage(previewItem.path) ? (
                        <img src={`${UPLOAD_URL}/${previewItem.path}`} alt={previewItem.name} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
                    ) : (
                        <iframe src={`${UPLOAD_URL}/${previewItem.path}`} className="w-full h-full min-h-[60vh] bg-white shadow-2xl rounded-lg" title="Document Preview"></iframe>
                    )}
                </div>
            </motion.div>
        </div>
      )}
      </AnimatePresence>, document.body)}

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
