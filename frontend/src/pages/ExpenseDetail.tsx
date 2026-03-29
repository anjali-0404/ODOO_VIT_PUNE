import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  getExpenseApprovals,
  getExpenseById,
  getExpenseHistory,
  type ApprovalResponse,
  type ExpenseHistoryResponse,
  type ExpenseResponse,
} from '../services/api';

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

export const ExpenseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState<ExpenseResponse | null>(null);
  const [approvals, setApprovals] = useState<ApprovalResponse[]>([]);
  const [history, setHistory] = useState<ExpenseHistoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadExpenseDetail = async () => {
      if (!id) {
        return;
      }

      setIsLoading(true);
      setError('');
      try {
        const [expenseData, approvalsData, historyData] = await Promise.all([
          getExpenseById(id),
          getExpenseApprovals(id),
          getExpenseHistory(id),
        ]);

        setExpense(expenseData);
        setApprovals(approvalsData);
        setHistory(historyData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load expense details');
      } finally {
        setIsLoading(false);
      }
    };

    void loadExpenseDetail();
  }, [id]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400">Loading expense details...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (!expense) {
    return <div className="p-8 text-center text-gray-400">Expense not found.</div>;
  }

  const timelineSteps = approvals.length > 0
    ? approvals
        .slice()
        .sort((a, b) => a.stepOrder - b.stepOrder)
        .map((item) => ({
          label: item.requiredRole || `STEP ${item.stepOrder}`,
          status: item.decision,
          time: item.decisionAt,
          comment: item.comment,
        }))
    : [
        { label: 'MANAGER', status: 'PENDING', time: undefined, comment: undefined },
        { label: 'FINANCE', status: 'PENDING', time: undefined, comment: undefined },
        { label: 'DIRECTOR', status: 'PENDING', time: undefined, comment: undefined },
      ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <button onClick={() => navigate('/expenses')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft size={18} /> Back to Expenses
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Expense {expense.id}</h1>
        <Badge variant={statusToBadge(expense.status)}>{expense.status}</Badge>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-gray-400">Employee ID</p><p className="font-medium">{expense.employeeId || '-'}</p></div>
          <div><p className="text-xs text-gray-400">Date</p><p className="font-medium">{expense.expenseDate}</p></div>
          <div><p className="text-xs text-gray-400">Category</p><p className="font-medium">{expense.category}</p></div>
          <div><p className="text-xs text-gray-400">Status</p><p className="font-medium">{expense.status}</p></div>
          <div><p className="text-xs text-gray-400">Amount</p><p className="font-medium text-lg">{expense.amount} {expense.currency}</p></div>
          <div className="col-span-2"><p className="text-xs text-gray-400">Description</p><p className="font-medium">{expense.description}</p></div>
        </div>

        {expense.receiptUrl && (
          <div className="mt-4 border-t pt-4">
            <p className="text-xs text-gray-400 mb-2">Receipt</p>
            <img src={expense.receiptUrl} alt="Receipt" className="max-h-48 rounded-lg shadow" />
          </div>
        )}
      </Card>

      {/* Approver trail */}
      <Card>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Approval Timeline</h3>
        <div className="space-y-3">
          {timelineSteps.map((step, idx) => {
            const isApproved = step.status === 'APPROVED';
            const isRejected = step.status === 'REJECTED';
            const Icon = isApproved ? CheckCircle2 : isRejected ? XCircle : Clock3;

            return (
              <div key={`${step.label}-${idx}`} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
                <Icon className={isApproved ? 'text-green-500' : isRejected ? 'text-red-500' : 'text-yellow-500'} size={18} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{step.label}</p>
                  <p className="text-xs text-gray-500">{step.status === 'PENDING' ? 'Pending' : step.status}</p>
                  <p className="text-xs text-gray-400 mt-1">{step.time ? new Date(step.time).toLocaleString() : 'Waiting'}</p>
                  {step.comment && <p className="text-xs text-gray-500 mt-1">Comment: {step.comment}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Expense History / Audit Log</h3>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400">No history entries yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-100 p-3">
                <p className="text-sm font-medium text-gray-800">{item.action}</p>
                <p className="text-xs text-gray-500 mt-1">By: {item.performedByName || `User #${item.performedBy || '-'}`}</p>
                <p className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleString()}</p>
                {item.comment && <p className="text-xs text-gray-500 mt-1">{item.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
