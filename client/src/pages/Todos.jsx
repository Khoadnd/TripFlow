import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, X, Trash2, Calendar, Pencil, CheckCircle2, Circle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, api } from '../lib/utils';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Card from '../components/Card';
import { useResource } from '../hooks/useResource';

const COLUMNS = {
  pending: { id: 'pending', title: 'To Do', icon: Circle, color: 'text-gray-500', bg: 'bg-gray-50' },
  'in-progress': { id: 'in-progress', title: 'In Progress', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50/50' },
  completed: { id: 'completed', title: 'Done', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50/50' }
};

export default function Todos() {
  const initialFormState = { title: '', due_date: '', status: 'pending', position: 0 };

  const {
    items,
    setItems,
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
    editingId,
    fetchItems
  } = useResource('/api/todos', initialFormState);

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

  return (
    <div className="h-auto lg:h-full flex flex-col">
      <PageHeader 
        title="Task Board" 
        subtitle="Manage your trip checklist"
        action={
            <Button onClick={openAddForm} icon={Plus}>
                New Task
            </Button>
        }
      />

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingId ? 'Edit Task' : 'New Task'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                <input type="text" className="w-full bg-gray-50 border-0 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" placeholder="What needs to be done?" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required autoFocus />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input type="date" className="w-full bg-gray-50 border-0 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" value={formData.due_date ? String(formData.due_date).split('T')[0] : ''} onChange={e => setFormData({...formData, due_date: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={closeForm}>Cancel</Button>
                <Button type="submit">
                    {editingId ? 'Save Changes' : 'Create Task'}
                </Button>
            </div>
        </form>
      </Modal>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 lg:overflow-y-auto lg:overflow-x-auto pb-4">
          {Object.values(COLUMNS).map((column, colIndex) => {
            const Icon = column.icon;
            return (
            <Card 
                key={column.id} 
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ delay: colIndex * 0.1 }}
                className={cn("flex flex-col h-full p-1 border-gray-100/50", column.bg)}
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
                                    <Button onClick={() => openEditForm(item)} variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button onClick={() => openDeleteConfirm(item)} variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
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
            </Card>
          )})}
        </div>
      </DragDropContext>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}
