import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Plus, UserPlus } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { createUser, listUsers, type AppUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

const roleOptions = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Manager', value: 'MANAGER' },
  { label: 'Employee', value: 'EMPLOYEE' },
  { label: 'Finance', value: 'FINANCE' },
  { label: 'Director', value: 'DIRECTOR' },
  { label: 'CFO', value: 'CFO' },
];

interface UserFormValues {
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'FINANCE' | 'DIRECTOR' | 'CFO';
  manager?: string;
  email: string;
  password: string;
}

const displayRole = (role: string) => {
  const map: Record<string, string> = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    EMPLOYEE: 'Employee',
    FINANCE: 'Finance',
    DIRECTOR: 'Director',
    CFO: 'CFO',
  };
  return map[role] || role;
};

export const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormValues>();

  const loadUsers = async () => {
    setIsLoading(true);
    setApiError('');
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  // Build manager options from existing users
  const managerOptions = users
    .filter(u => u.role === 'MANAGER' || u.role === 'ADMIN' || u.role === 'CFO' || u.role === 'DIRECTOR')
    .map(u => ({ label: u.fullName, value: String(u.id) }));

  const onSubmit = async (data: UserFormValues) => {
    setApiError('');
    setIsSubmitting(true);
    try {
      await createUser({
        fullName: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        managerId: data.manager ? Number(data.manager) : undefined,
      });
      setIsModalOpen(false);
      reset();
      await loadUsers();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Button onClick={() => setIsModalOpen(true)} disabled={user?.role !== 'Admin'}>
          <Plus size={16} className="mr-2" /> New
        </Button>
      </div>

      {apiError && <p className="text-sm text-red-500">{apiError}</p>}

      <Card className="overflow-hidden p-0!">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Manager</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
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
                          {u.fullName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-800">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === 'ADMIN' ? 'approved' : u.role === 'MANAGER' ? 'submitted' : 'default'}>
                        {displayRole(u.role)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {u.managerId ? users.find(candidate => candidate.id === u.managerId)?.fullName || `#${u.managerId}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
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
          <Input
            label="Temporary Password"
            type="password"
            {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
            error={errors.password?.message as string}
            placeholder="minimum 6 characters"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Create User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
