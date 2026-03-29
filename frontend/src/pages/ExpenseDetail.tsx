import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { getExpenses, submitExpense, type Expense } from '../services/mockData';

const statusToBadge = (status: string) => {
  const map: Record<string, 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected'> = {
    Draft: 'draft', Submitted: 'submitted', 'Waiting Approval': 'pending', Approved: 'approved', Rejected: 'rejected',
  };
  return map[status] || 'default';
};

export const ExpenseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState<Expense | null>(null);

  useEffect(() => {
    const all = getExpenses();
    const found = all.find(e => e.id === id);
    setExpense(found || null);
  }, [id]);

  if (!expense) {
    return <div className="p-8 text-center text-gray-400">Expense not found.</div>;
  }

  const handleSubmit = () => {
    submitExpense(expense.id);
    setExpense({ ...expense, status: 'Submitted' });
  };

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
          <div><p className="text-xs text-gray-400">Employee</p><p className="font-medium">{expense.employee}</p></div>
          <div><p className="text-xs text-gray-400">Date</p><p className="font-medium">{expense.date}</p></div>
          <div><p className="text-xs text-gray-400">Category</p><p className="font-medium">{expense.category}</p></div>
          <div><p className="text-xs text-gray-400">Paid By</p><p className="font-medium">{expense.paidBy}</p></div>
          <div><p className="text-xs text-gray-400">Amount</p><p className="font-medium text-lg">{expense.amount} {expense.currency}</p></div>
          {expense.convertedAmount && expense.companyCurrency && expense.currency !== expense.companyCurrency && (
            <div><p className="text-xs text-gray-400">Converted ({expense.companyCurrency})</p><p className="font-medium text-lg text-primary">{expense.convertedAmount} {expense.companyCurrency}</p></div>
          )}
          <div className="col-span-2"><p className="text-xs text-gray-400">Description</p><p className="font-medium">{expense.description}</p></div>
          {expense.remarks && <div className="col-span-2"><p className="text-xs text-gray-400">Remarks</p><p className="text-gray-600">{expense.remarks}</p></div>}
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
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Approver Trail</h3>
        {expense.approverTrail.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No approver actions yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-600">Approver</th>
                <th className="text-left py-2 text-gray-600">Status</th>
                <th className="text-left py-2 text-gray-600">Time</th>
                <th className="text-left py-2 text-gray-600">Comment</th>
              </tr>
            </thead>
            <tbody>
              {expense.approverTrail.map((a, idx) => (
                <tr key={idx} className="border-b border-gray-50">
                  <td className="py-2">{a.approver}</td>
                  <td className="py-2"><Badge variant={a.status === 'Approved' ? 'approved' : 'rejected'}>{a.status}</Badge></td>
                  <td className="py-2 text-gray-500">{a.time}</td>
                  <td className="py-2 text-gray-500">{a.comment || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {expense.status === 'Draft' && (
        <Button onClick={handleSubmit} className="w-full">Submit Expense</Button>
      )}
    </div>
  );
};
