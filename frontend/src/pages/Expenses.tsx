import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Plus, FileText } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { getMyExpenses, submitExpense as submitExpenseApi, type ExpenseResponse } from '../services/api';

const statusToBadge = (status: string) => {
  const map: Record<string, 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected'> = {
    Draft: 'draft',
    DRAFT: 'draft',
    Submitted: 'submitted',
    SUBMITTED: 'submitted',
    'Waiting Approval': 'pending',
    PENDING: 'pending',
    Approved: 'approved',
    APPROVED: 'approved',
    Rejected: 'rejected',
    REJECTED: 'rejected',
  };
  return map[status] || 'default';
};

export const Expenses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'upload' | 'new'>('upload');
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingId, setIsSubmittingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadExpenses = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getMyExpenses();
      setExpenses(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadExpenses();
  }, [user]);

  const handleSubmitDraft = async (expenseId: number) => {
    setError('');
    setIsSubmittingId(expenseId);
    try {
      await submitExpenseApi(expenseId);
      await loadExpenses();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit expense');
    } finally {
      setIsSubmittingId(null);
    }
  };

  const toSubmit = expenses.filter(e => e.status === 'DRAFT' || e.status === 'Draft');
  const waitingApproval = expenses.filter(e => ['SUBMITTED', 'PENDING', 'Submitted', 'Waiting Approval'].includes(e.status));
  const approved = expenses.filter(e => e.status === 'APPROVED' || e.status === 'Approved');

  const toSubmitTotal = toSubmit.reduce((s, e) => s + e.amount, 0);
  const waitingTotal = waitingApproval.reduce((s, e) => s + e.amount, 0);
  const approvedTotal = approved.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
      </div>

      {/* Tabs: Upload / New */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'upload' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Upload size={16} /> Upload
        </button>
        <button
          onClick={() => navigate('/expenses/create')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'new' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Plus size={16} /> New
        </button>
      </div>

      {/* Summary cards matching wireframe: To Submit | Waiting Approval | Approved */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div whileHover={{ y: -2 }} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">To Submit</p>
          <p className="text-2xl font-bold text-gray-900">
            {toSubmitTotal.toLocaleString()} <span className="text-sm font-normal text-gray-400">rs</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">{toSubmit.length} expense(s)</p>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">→</span>
            <p className="text-sm text-gray-500">Waiting approval</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {waitingTotal.toLocaleString()} <span className="text-sm font-normal text-gray-400">rs</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">{waitingApproval.length} expense(s)</p>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">→</span>
            <p className="text-sm text-gray-500">Approved</p>
          </div>
          <p className="text-2xl font-bold text-success mt-1">
            {approvedTotal.toLocaleString()} <span className="text-sm font-normal text-gray-400">rs</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">{approved.length} expense(s)</p>
        </motion.div>
      </div>

      {/* Expense table matching wireframe columns */}
      <Card className="overflow-hidden p-0!">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Paid By</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Remarks</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">Loading expenses...</td>
                </tr>
              )}

              {!isLoading && error && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-red-500">{error}</td>
                </tr>
              )}

              {!isLoading && !error && expenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    <FileText className="mx-auto mb-3 text-gray-300" size={40} />
                    <p>No expenses yet. Click "New" to create one.</p>
                  </td>
                </tr>
              ) : (
                !isLoading && !error && expenses.map((exp) => (
                  <motion.tr
                    key={exp.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/expenses/${exp.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">{user?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-50 truncate">{exp.description}</td>
                    <td className="px-4 py-3 text-gray-600">{exp.expenseDate}</td>
                    <td className="px-4 py-3 text-gray-600">{exp.category}</td>
                    <td className="px-4 py-3 text-gray-600">-</td>
                    <td className="px-4 py-3 text-gray-500 max-w-37.5 truncate">-</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">{exp.amount} {exp.currency}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={statusToBadge(exp.status)}>{exp.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(exp.status === 'DRAFT' || exp.status === 'Draft') ? (
                        <button
                          type="button"
                          className="text-xs px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                          disabled={isSubmittingId === exp.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleSubmitDraft(exp.id);
                          }}
                        >
                          {isSubmittingId === exp.id ? 'Submitting...' : 'Submit'}
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
