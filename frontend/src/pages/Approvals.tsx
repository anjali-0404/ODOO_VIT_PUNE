import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import {
  approveExpense,
  getPendingApprovals,
  rejectExpense,
  type ExpenseResponse,
} from '../services/api';
import { pushNotification } from '../services/notifications';

export const Approvals = () => {
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
  const [commentModal, setCommentModal] = useState<{ open: boolean; type: 'approve' | 'reject'; expenseId: string | number }>({
    open: false, type: 'approve', expenseId: '',
  });
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    employee: '',
    status: '',
    minAmount: '',
    maxAmount: '',
    date: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getPendingApprovals();
      setExpenses(data);
      setSelectedExpenseIds(new Set());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to fetch pending approvals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleAction = (type: 'approve' | 'reject', expenseId: string | number) => {
    setCommentModal({ open: true, type, expenseId });
    setComment('');
  };

  const confirmAction = async () => {
    setError('');
    setIsActionLoading(true);
    try {
      if (commentModal.type === 'approve') {
        await approveExpense(String(commentModal.expenseId), comment);
        pushNotification({
          title: 'Expense Approved',
          message: `Expense #${commentModal.expenseId} approved successfully.`,
          type: 'success',
        });
      } else {
        await rejectExpense(String(commentModal.expenseId), comment);
        pushNotification({
          title: 'Expense Rejected',
          message: `Expense #${commentModal.expenseId} rejected.`,
          type: 'warning',
        });
      }

      setCommentModal({ open: false, type: 'approve', expenseId: '' });
      setComment('');
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Action failed. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const toggleExpenseSelection = (expenseId: string) => {
    setSelectedExpenseIds((current) => {
      const updated = new Set(current);
      if (updated.has(expenseId)) {
        updated.delete(expenseId);
      } else {
        updated.add(expenseId);
      }
      return updated;
    });
  };

  const toggleSelectAllFiltered = (expenseIds: string[]) => {
    const allSelected = expenseIds.every((id) => selectedExpenseIds.has(id));
    setSelectedExpenseIds(() => {
      if (allSelected) {
        return new Set();
      }
      return new Set(expenseIds);
    });
  };

  const handleBulkApprove = async () => {
    if (selectedExpenseIds.size === 0) {
      return;
    }

    setError('');
    setIsActionLoading(true);
    try {
      const ids = [...selectedExpenseIds];
      await Promise.allSettled(ids.map((id) => approveExpense(id, 'Bulk approved by manager')));
      pushNotification({
        title: 'Bulk Approval Completed',
        message: `${ids.length} expenses were approved in bulk.`,
        type: 'success',
      });
      await loadData();
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'Bulk approval failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredExpenses = expenses.filter((exp) => {
    const employeeMatch = !filters.employee || (exp.employeeEmail || '').toLowerCase().includes(filters.employee.toLowerCase());
    const statusMatch = !filters.status || exp.status.toUpperCase() === filters.status.toUpperCase();
    const minAmount = filters.minAmount ? Number(filters.minAmount) : null;
    const maxAmount = filters.maxAmount ? Number(filters.maxAmount) : null;
    const amountMatch = (minAmount === null || exp.amount >= minAmount) && (maxAmount === null || exp.amount <= maxAmount);
    const dateMatch = !filters.date || exp.expenseDate === filters.date;
    return employeeMatch && statusMatch && amountMatch && dateMatch;
  });

  const filteredExpenseIds = filteredExpenses.map((exp) => String(exp.id));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Approvals to review</h1>

      <Card className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Input
            label="Employee"
            placeholder="employee@email.com"
            value={filters.employee}
            onChange={(e) => setFilters((prev) => ({ ...prev, employee: e.target.value }))}
          />
          <Input
            label="Date"
            type="date"
            value={filters.date}
            onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
          />
          <Input
            label="Min Amount"
            type="number"
            value={filters.minAmount}
            onChange={(e) => setFilters((prev) => ({ ...prev, minAmount: e.target.value }))}
          />
          <Input
            label="Max Amount"
            type="number"
            value={filters.maxAmount}
            onChange={(e) => setFilters((prev) => ({ ...prev, maxAmount: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            {filteredExpenses.length} request(s) shown, {selectedExpenseIds.size} selected
          </p>
          <Button
            size="sm"
            variant="primary"
            isLoading={isActionLoading}
            onClick={handleBulkApprove}
            disabled={selectedExpenseIds.size === 0}
          >
            Bulk Approve Selected
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0!">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-center px-4 py-3 font-medium text-gray-600">
                  <input
                    type="checkbox"
                    checked={filteredExpenseIds.length > 0 && filteredExpenseIds.every((id) => selectedExpenseIds.has(id))}
                    onChange={() => toggleSelectAllFiltered(filteredExpenseIds)}
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Approval Subject</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Request Owner</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Request Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Total amount</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">Loading pending approvals...</td>
                </tr>
              )}
              {!isLoading && error && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-red-500">{error}</td>
                </tr>
              )}
              {!isLoading && !error && filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    No pending approvals.
                  </td>
                </tr>
              ) : (
                !isLoading && !error && <AnimatePresence>
                  {filteredExpenses.map((exp) => {
                    return (
                      <motion.tr
                        key={exp.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedExpenseIds.has(String(exp.id))}
                            onChange={() => toggleExpenseSelection(String(exp.id))}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">{exp.description || 'none'}</td>
                        <td className="px-4 py-3 text-gray-600">{exp.employeeEmail || `Employee #${exp.employeeId || '-'}`}</td>
                        <td className="px-4 py-3 text-gray-600">{exp.category}</td>
                        <td className="px-4 py-3">
                          <Badge variant={exp.status === 'APPROVED' || exp.status === 'Approved' ? 'approved' : exp.status === 'REJECTED' || exp.status === 'Rejected' ? 'rejected' : 'pending'}>
                            {exp.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{exp.expenseDate || '-'}</td>
                        <td className="px-4 py-3 text-gray-800">
                          <span className="font-medium">{exp.amount} {exp.currency}</span>
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
              isLoading={isActionLoading}
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
