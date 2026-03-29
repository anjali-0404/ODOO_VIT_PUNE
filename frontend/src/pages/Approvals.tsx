import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import {
  getExpensesForApproval,
  approveExpense,
  rejectExpense,
  convertCurrency,
  getCompanyCurrency,
  type Expense,
} from '../services/mockData';

export const Approvals = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [commentModal, setCommentModal] = useState<{ open: boolean; type: 'approve' | 'reject'; expenseId: string }>({
    open: false, type: 'approve', expenseId: '',
  });
  const [comment, setComment] = useState('');

  const companyCurrency = getCompanyCurrency();

  const loadData = () => {
    setExpenses(getExpensesForApproval());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = (type: 'approve' | 'reject', expenseId: string) => {
    setCommentModal({ open: true, type, expenseId });
    setComment('');
  };

  const confirmAction = () => {
    const approverName = user?.name || 'Manager';
    if (commentModal.type === 'approve') {
      approveExpense(commentModal.expenseId, approverName, comment);
    } else {
      rejectExpense(commentModal.expenseId, approverName, comment);
    }
    setCommentModal({ open: false, type: 'approve', expenseId: '' });
    loadData();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Approvals to review</h1>

      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Approval Subject</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Request Owner</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Request Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Total amount<br /><span className="text-xs text-gray-400">(in company's currency)</span>
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No pending approvals.
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {expenses.map((exp) => {
                    const converted = exp.currency !== companyCurrency
                      ? convertCurrency(exp.amount, exp.currency, companyCurrency)
                      : exp.amount;
                    return (
                      <motion.tr
                        key={exp.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">{exp.description || 'none'}</td>
                        <td className="px-4 py-3 text-gray-600">{exp.employee}</td>
                        <td className="px-4 py-3 text-gray-600">{exp.category}</td>
                        <td className="px-4 py-3">
                          <Badge variant={exp.status === 'Approved' ? 'approved' : exp.status === 'Rejected' ? 'rejected' : 'pending'}>
                            {exp.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-800">
                          {exp.currency !== companyCurrency && (
                            <span className="text-xs text-red-500 mr-1">{exp.amount} {exp.currency}</span>
                          )}
                          <span className="font-medium">= {converted} {companyCurrency}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button size="sm" variant="primary" onClick={() => handleAction('approve', exp.id)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleAction('reject', exp.id)}>
                              Reject
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-gray-400">
        Once the expense is approved/rejected by manager, that record should become read-only.
        The status should get set in request status field and the buttons should become invisible.
      </p>

      {/* Comment modal */}
      <Modal
        isOpen={commentModal.open}
        onClose={() => setCommentModal({ ...commentModal, open: false })}
        title={commentModal.type === 'approve' ? 'Approve Expense' : 'Reject Expense'}
      >
        <div className="space-y-4">
          <Input
            label="Comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a reason or note..."
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCommentModal({ ...commentModal, open: false })}>Cancel</Button>
            <Button
              variant={commentModal.type === 'approve' ? 'primary' : 'danger'}
              onClick={confirmAction}
            >
              {commentModal.type === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
