import { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, TrendingUp, DollarSign, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, X, Calendar, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { cn, api } from '../lib/utils';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Card from '../components/Card';
import { useResource } from '../hooks/useResource';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const CATEGORIES = ['Food', 'Transport', 'Accommodation', 'Activity', 'Shopping', 'Other'];

export default function Budget() {
  const initialFormState = { title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], notes: '' };

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
  } = useResource('/api/expenses', initialFormState);

  const [totalBudget, setTotalBudget] = useState(5000); // Default budget

  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
      try {
          const res = await api.get('/api/me');
          if (res.data.budget_limit) setTotalBudget(res.data.budget_limit);
      } catch (error) {
          console.error("Error fetching budget:", error);
      }
  };

  const handleBudgetChange = async (e) => {
      const val = parseFloat(e.target.value);
      setTotalBudget(val);
      try {
          await api.put('/api/me', { budget_limit: val });
      } catch (error) {
          console.error("Error updating budget:", error);
      }
  };

  const totalSpent = items.reduce((acc, item) => acc + item.amount, 0);
  const remaining = totalBudget - totalSpent;
  const progress = Math.min((totalSpent / totalBudget) * 100, 100);

  // Prepare chart data
  const categoryData = CATEGORIES.map(cat => {
      const value = items.filter(i => i.category === cat).reduce((acc, i) => acc + i.amount, 0);
      return { name: cat, value };
  }).filter(d => d.value > 0);

  return (
    <div className="h-auto lg:h-full flex flex-col gap-6 pb-4 lg:pb-0">
      <PageHeader 
        title="Budget & Expenses" 
        subtitle="Track your spending"
        action={
            <Button onClick={openAddForm} variant="dark">
                <Plus className="w-4 h-4 md:w-5 md:h-5" /> 
                <span className="hidden md:inline">Log Expense</span>
                <span className="md:hidden">Add</span>
            </Button>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Wallet className="w-24 h-24 text-blue-600" />
              </div>
              <p className="text-gray-500 font-medium mb-1">Total Budget</p>
              <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-400">¥</span>
                  <input 
                    type="number" 
                    value={totalBudget} 
                    onChange={handleBudgetChange}
                    className="text-3xl font-bold text-gray-900 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 outline-none w-32"
                  />
              </div>
              <div className="mt-4 text-sm text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded-lg font-medium">
                  Editable
              </div>
          </Card>

          <Card>
              <div className="flex justify-between items-start mb-2">
                  <p className="text-gray-500 font-medium">Total Spent</p>
                  <div className="p-2 bg-red-50 rounded-xl text-red-600">
                      <ArrowUpRight className="w-5 h-5" />
                  </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900">¥{totalSpent.toFixed(2)}</h3>
              <p className="text-sm text-gray-400 mt-1">{((totalSpent/totalBudget)*100).toFixed(1)}% of budget</p>
          </Card>

          <Card>
              <div className="flex justify-between items-start mb-2">
                  <p className="text-gray-500 font-medium">Remaining</p>
                  <div className="p-2 bg-green-50 rounded-xl text-green-600">
                      <ArrowDownRight className="w-5 h-5" />
                  </div>
              </div>
              <h3 className={cn("text-3xl font-bold", remaining < 0 ? "text-red-600" : "text-gray-900")}>
                  ¥{remaining.toFixed(2)}
              </h3>
              <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-1000", remaining < 0 ? "bg-red-500" : "bg-green-500")} 
                    style={{ width: `${progress}%` }}
                  ></div>
              </div>
          </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-grow lg:overflow-hidden">
          {/* Chart Section */}
          <Card className="w-full lg:w-1/3 flex flex-col min-h-[300px]">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-gray-400" /> Spending Breakdown
              </h3>
              <div className="h-[300px] lg:h-auto lg:flex-grow w-full">
                  {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={categoryData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                              >
                                  {categoryData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                              </Pie>
                              <Tooltip formatter={(value) => `$${value}`} />
                              <Legend />
                          </PieChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                          <PieChartIcon className="w-16 h-16 mb-4 opacity-20" />
                          <p>No expenses yet</p>
                      </div>
                  )}
              </div>
          </Card>

          {/* Transactions List */}
          <Card className="w-full lg:w-2/3 flex flex-col lg:overflow-hidden min-h-[400px] lg:min-h-0 p-0">
              <div className="p-6 border-b border-gray-100">
                  <h3 className="font-bold text-gray-800">Recent Transactions</h3>
              </div>
              <div className="flex-grow lg:overflow-y-auto p-2">
                  {items.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p>No transactions recorded</p>
                      </div>
                  ) : (
                      <div className="divide-y divide-gray-50">
                        {items.map((item, index) => {
                            const catIndex = CATEGORIES.indexOf(item.category);
                            const color = catIndex !== -1 ? COLORS[catIndex % COLORS.length] : '#9CA3AF';
                            
                            return (
                              <motion.div 
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group rounded-xl"
                              >
                                  <div className="flex items-center gap-4">
                                      <div>
                                          <h4 className="font-bold text-gray-900">{item.title}</h4>
                                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                              <span 
                                                className="px-2.5 py-0.5 rounded-full text-white font-medium text-[10px] shadow-sm"
                                                style={{ backgroundColor: color }}
                                              >
                                                {item.category}
                                              </span>
                                              <span>{format(new Date(item.date), 'MMM d, yyyy')}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <span className="font-bold text-gray-900 text-lg">-¥{item.amount.toFixed(2)}</span>
                                      <div className="flex gap-1">
                                          <Button onClick={() => openEditForm(item)} variant="ghost" size="icon" className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                                              <Edit2 className="w-4 h-4" />
                                          </Button>
                                          <Button onClick={() => openDeleteConfirm(item)} variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50 opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                                              <Trash2 className="w-4 h-4" />
                                          </Button>
                                      </div>
                                  </div>
                              </motion.div>
                          )})}
                      </div>
                  )}
              </div>
          </Card>
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingId ? "Edit Expense" : "Log Expense"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input type="text" placeholder="e.g. Dinner at Chez Pierre" className="w-full bg-gray-50 border-0 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required autoFocus />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount (¥)</label>
                    <input type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" className="w-full bg-gray-50 border-0 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input type="date" className="w-full bg-gray-50 border-0 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all" value={formData.date ? formData.date.split('T')[0] : ''} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setFormData({...formData, category: cat})}
                            className={cn(
                                "py-2 px-1 rounded-lg text-xs font-medium transition-all border",
                                formData.category === cat 
                                    ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea className="w-full bg-gray-50 border-0 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all h-20 resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
            </div>
            
            <Button type="submit" className="w-full mt-2" size="lg">
                Save Expense
            </Button>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Expense"
        message={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}
