import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, X, Trash2, Calendar, Pencil, CheckCircle2, Circle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, API_BASE_URL, api } from '../lib/utils';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

const API_URL = `${API_BASE_URL}/api/todos`;

const COLUMNS = {
  pending: { id: 'pending', title: 'To Do', icon: Circle, color: 'text-gray-500', bg: 'bg-gray-50' },
  'in-progress': { id: 'in-progress', title: 'In Progress', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50/50' },
  completed: { id: 'completed', title: 'Done', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50/50' }
};

export default function Todos() {
  const [items, setItems] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ title: '', due_date: '' });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/api/todos');
      setItems(res.data);
    } catch (error) {
      console.error("Error fetching todos:", error);
    }
  };

  const getColumnItems = (status) => items
    .filter(item => (item.status || 'pending') === status)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;
    const draggedItemId = parseInt(draggableId);

    // Get items in destination column (sorted by position)
    // We need to filter out the dragged item if it's already in this column (for calculation)
    let destItems = getColumnItems(destStatus).filter(i => i.id !== draggedItemId);

    // Insert dragged item at new index to calculate position
    // We use a placeholder for the dragged item to find neighbors
    const draggedItem = items.find(i => i.id === draggedItemId);
    
    // Calculate new position
    let newPos;
    // If inserting at 0
    if (destination.index === 0) {
        if (destItems.length === 0) {
            newPos = 10000;
        } else {
            newPos = (destItems[0].position || 0) / 2;
        }
    } else if (destination.index >= destItems.length) {
        const lastItem = destItems[destItems.length - 1];
        newPos = (lastItem.position || 0) + 10000;
    } else {
        const prevItem = destItems[destination.index - 1];
        const nextItem = destItems[destination.index];
        newPos = ((prevItem.position || 0) + (nextItem.position || 0)) / 2;
    }

    // Optimistic update
    const updatedItems = items.map(item => 
        item.id === draggedItemId 
            ? { ...item, status: destStatus, position: newPos } 
            : item
    );
    setItems(updatedItems);

    try {
      await api.put(`/api/todos/${draggableId}`, { 
          status: destStatus,
          position: newPos 
      });
    } catch (error) {
      console.error("Error updating todo status:", error);
      fetchItems(); // Revert on error
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/api/todos/${editingItem.id}`, formData);
      } else {
        await api.post('/api/todos', { ...formData, status: 'pending', position: 0 });
      }
      setIsFormOpen(false);
      setEditingItem(null);
      setFormData({ title: '', due_date: '' });
      fetchItems();
    } catch (error) {
      console.error("Error saving todo:", error);
    }
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      due_date: item.due_date ? new Date(item.due_date).toISOString().split('T')[0] : ''
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/api/todos/${itemToDelete.id}`);
      fetchItems();
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  return (
    <div className="h-auto lg:h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 lg:mb-8 pt-2">
        <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Task Board</h2>
            <p className="text-sm md:text-base text-gray-500">Manage your trip checklist</p>
        </div>
        <button 
            onClick={() => {
                setEditingItem(null);
                setFormData({ title: '', due_date: '' });
                setIsFormOpen(true);
            }} 
            className="bg-gray-900 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-xl hover:bg-gray-800 flex items-center gap-2 shadow-lg shadow-gray-900/20 transition-all hover:scale-105 text-sm md:text-base"
        >
            <Plus className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden md:inline">New Task</span><span className="md:hidden">Add</span>
        </button>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? 'Edit Task' : 'New Task'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                <input type="text" className="w-full bg-gray-50 border-0 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" placeholder="What needs to be done?" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required autoFocus />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input type="date" className="w-full bg-gray-50 border-0 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 font-medium transition-all transform hover:scale-105">{editingItem ? 'Save Changes' : 'Create Task'}</button>
            </div>
        </form>
      </Modal>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 lg:overflow-y-auto lg:overflow-x-auto pb-4">
          {Object.values(COLUMNS).map((column, colIndex) => {
            const Icon = column.icon;
            return (
            <motion.div 
                key={column.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: colIndex * 0.1 }}
                className={cn("flex flex-col h-full rounded-3xl border border-gray-100/50 p-1", column.bg)}
            >
              <div className="p-4 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2">
                      <Icon className={cn("w-5 h-5", column.color)} />
                      {column.title}
                  </h3>
                  <span className="bg-white/50 px-3 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm border border-gray-100">
                      {getColumnItems(column.id).length}
                  </span>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                        "flex-grow space-y-3 p-3 rounded-2xl transition-colors lg:overflow-y-auto custom-scrollbar",
                        snapshot.isDraggingOver ? "bg-black/5" : ""
                    )}
                  >
                    {getColumnItems(column.id).map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                                "bg-white p-5 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
                                snapshot.isDragging ? "rotate-2 shadow-xl ring-2 ring-blue-500/20 scale-105 z-50" : ""
                            )}
                            style={provided.draggableProps.style}
                          >
                            <div className="flex justify-between items-start mb-3">
                                <h4 className={cn("font-bold text-gray-800 leading-snug", item.status === 'completed' && "line-through text-gray-400")}>{item.title}</h4>
                                <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"><Pencil className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteClick(item)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            {item.due_date && (
                                <div className={cn("flex items-center gap-1.5 text-xs font-medium mt-2", 
                                    new Date(item.due_date) < new Date() && item.status !== 'completed' ? "text-red-500" : "text-gray-400"
                                )}>
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(item.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </motion.div>
          )})}
        </div>
      </DragDropContext>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}
