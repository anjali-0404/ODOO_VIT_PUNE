import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Plus, Send, UserPlus } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import {
  getMockUsers,
  sendPasswordEmail,
  type MockUser,
} from '../services/mockData';

const roleOptions = [
  { label: 'Admin', value: 'Admin' },
  { label: 'Manager', value: 'Manager' },
  { label: 'Employee', value: 'Employee' },
  { label: 'Finance', value: 'Finance' },
  { label: 'CFO', value: 'CFO' },
];

export const Users = () => {
  const [users, setUsers] = useState<MockUser[]>(() => getMockUsers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ email: string; password: string } | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const loadUsers = () => {
    setUsers(getMockUsers());
  };

  // Build manager options from existing users
  const managerOptions = users
    .filter(u => u.role === 'Manager' || u.role === 'Admin' || u.role === 'CFO')
    .map(u => ({ label: u.name, value: u.id }));

  const onSubmit = (data: Record<string, string>) => {
    const managerUser = users.find(u => u.id === data.manager);
    const usersRaw = localStorage.getItem('mockUsers');
    const allUsers = usersRaw ? JSON.parse(usersRaw) : [];
    const nextId = `user-${allUsers.length + 1}`;

    const newUser: MockUser = {
      id: nextId,
      name: data.name,
      email: data.email,
      role: data.role as MockUser['role'],
      managerId: data.manager || undefined,
      managerName: managerUser?.name || undefined,
    };

    // Also save with password field for login
    allUsers.push({ ...newUser, password: 'temp123' });
    localStorage.setItem('mockUsers', JSON.stringify(allUsers));

    setIsModalOpen(false);
    reset();
    loadUsers();
  };

  const handleSendPassword = (email: string) => {
    const pwd = sendPasswordEmail(email);
    setPasswordMsg({ email, password: pwd });
    setTimeout(() => setPasswordMsg(null), 5000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={16} className="mr-2" /> New
        </Button>
      </div>

      {passwordMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm"
        >
          Password sent to <strong>{passwordMsg.email}</strong>: <code className="bg-green-100 px-2 py-0.5 rounded">{passwordMsg.password}</code>
          <span className="text-xs text-green-600 ml-2">(user can change it afterwards)</span>
        </motion.div>
      )}

      <Card className="overflow-hidden p-0!">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Manager</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <UserPlus className="mx-auto mb-3 text-gray-300" size={40} />
                    <p>No users yet. Click "New" to create one.</p>
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === 'Admin' ? 'approved' : u.role === 'Manager' ? 'submitted' : 'default'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.managerName || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      <Button size="sm" variant="outline" onClick={() => handleSendPassword(u.email)}>
                        <Send size={14} className="mr-1" /> Send password
                      </Button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create user modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New User">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="User Name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message as string}
            placeholder="e.g. marc"
          />
          <Select
            label="Role"
            options={roleOptions}
            {...register('role', { required: 'Role is required' })}
            error={errors.role?.message as string}
          />
          <Select
            label="Manager"
            options={[{ label: '— None —', value: '' }, ...managerOptions]}
            {...register('manager')}
          />
          <Input
            label="Email"
            type="email"
            {...register('email', { required: 'Email is required' })}
            error={errors.email?.message as string}
            placeholder="e.g. marc@gmail.com"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
