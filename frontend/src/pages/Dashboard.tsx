import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { getExpenses, type Expense } from '../services/mockData';
import { useAuth } from '../context/AuthContext';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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

  // Monthly trend from real data
  const monthMap: Record<string, number> = {};
  expenses.forEach(e => {
    const month = e.date ? e.date.substring(0, 7) : 'Unknown';
    monthMap[month] = (monthMap[month] || 0) + e.amount;
  });
  const months = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0]));
  const monthChartData = months.map(([month, amount]) => ({ month, amount }));

  const categoryChartData = categories.map(([name, value]) => ({ name, value }));
  const approvalRatioData = [
    { name: 'Approved', value: approved.length, color: '#16A34A' },
    { name: 'Rejected', value: rejected.length, color: '#DC2626' },
    { name: 'Pending', value: pending.length, color: '#F59E0B' },
  ];

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
          {monthChartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No expense data yet. Submit some expenses to see trends.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthChartData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="#2563EB" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Category breakdown from real data */}
        <Card>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Category Breakdown</h3>
          {categoryChartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No categories to display.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={categoryChartData}>
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#16A34A" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Approved vs Rejected</h3>
        {approvalRatioData.every((item) => item.value === 0) ? (
          <p className="text-sm text-gray-400">No approval data yet.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={approvalRatioData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={100}>
                  {approvalRatioData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

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
