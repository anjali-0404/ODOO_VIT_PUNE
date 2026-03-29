import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { getExpenses, type Expense } from '../services/mockData';
import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    setExpenses(getExpenses());
  }, []);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const pending = expenses.filter(e => e.status === 'Submitted' || e.status === 'Waiting Approval');
  const approved = expenses.filter(e => e.status === 'Approved');
  const rejected = expenses.filter(e => e.status === 'Rejected');

  const stats = [
    { label: 'Total Expenses', value: `$${total.toLocaleString()}`, icon: <DollarSign className="text-primary" size={24} />, bg: 'bg-blue-50' },
    { label: 'Pending Approvals', value: pending.length.toString(), icon: <Clock className="text-warning" size={24} />, bg: 'bg-yellow-50' },
    { label: 'Approved', value: approved.length.toString(), icon: <CheckCircle className="text-success" size={24} />, bg: 'bg-green-50' },
    { label: 'Rejected', value: rejected.length.toString(), icon: <XCircle className="text-danger" size={24} />, bg: 'bg-red-50' },
  ];

  // Category breakdown from real data
  const categoryMap: Record<string, number> = {};
  expenses.forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });
  const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
  const maxCat = categories.length > 0 ? categories[0][1] : 1;

  // Monthly trend from real data
  const monthMap: Record<string, number> = {};
  expenses.forEach(e => {
    const month = e.date ? e.date.substring(0, 7) : 'Unknown';
    monthMap[month] = (monthMap[month] || 0) + e.amount;
  });
  const months = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0]));
  const maxMonth = months.length > 0 ? Math.max(...months.map(m => m[1])) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.name || 'User'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="flex items-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className={`p-3 ${stat.bg} rounded-xl shrink-0`}>
              {stat.icon}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Expense Trends - bar chart from real data */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Expense Trends</h3>
          {months.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No expense data yet. Submit some expenses to see trends.
            </div>
          ) : (
            <div className="space-y-3">
              {months.map(([month, amount]) => (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 shrink-0">{month}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary to-blue-400 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${(amount / maxMonth) * 100}%` }}
                    >
                      <span className="text-[10px] text-white font-medium">${amount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Category breakdown from real data */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Category Breakdown</h3>
          {categories.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No categories to display.
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map(([cat, amount]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 font-medium">{cat}</span>
                    <span className="text-sm text-gray-500">${amount.toLocaleString()}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(amount / maxCat) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent expenses */}
      <Card>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Expenses</h3>
        {expenses.length === 0 ? (
          <p className="text-sm text-gray-400">No recent expenses.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Employee</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Description</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Amount</th>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {expenses.slice(0, 5).map(exp => (
                  <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3">{exp.employee}</td>
                    <td className="py-2 px-3 text-gray-600">{exp.description}</td>
                    <td className="py-2 px-3 font-medium">{exp.amount} {exp.currency}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        exp.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        exp.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{exp.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
