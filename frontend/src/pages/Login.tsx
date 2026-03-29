import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, type Role } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { getMe, loginUser } from '../services/api';

interface LoginFormValues {
  email: string;
  password: string;
}

const normalizeRole = (role: string | undefined): Exclude<Role, null> => {
  const roleMap: Record<string, Exclude<Role, null>> = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    EMPLOYEE: 'Employee',
    FINANCE: 'Finance',
    DIRECTOR: 'Director',
    CFO: 'CFO',
  };

  return roleMap[role?.toUpperCase() || 'EMPLOYEE'] || 'Employee';
};

export const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: LoginFormValues) => {
    setApiError('');
    setIsSubmitting(true);
    try {
      const loginResponse = await loginUser(data.email, data.password);
      const profile = await getMe();

      login(loginResponse.accessToken, {
        id: String(profile.id),
        name: profile.name,
        email: profile.email,
        role: normalizeRole(profile.role),
        managerId: profile.managerId,
      });

      navigate('/dashboard');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Sign in to access the comprehensive ERP Reimbursement Management System.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email format' }
              })}
              error={errors.email?.message as string}
            />
            <Input
              label="Password"
              type="password"
              {...register('password', { required: 'Password is required' })}
              error={errors.password?.message as string}
            />
          </div>

          {apiError && <p className="text-red-500 text-sm text-center">{apiError}</p>}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Login
          </Button>

          <div className="flex items-center justify-between text-sm mt-4">
            <Link to="/signup" className="font-medium text-primary hover:text-blue-500 transition-colors">
              Don't have an account? Signup
            </Link>
            <button type="button" className="font-medium text-gray-500 hover:text-gray-900" disabled>
              Forgot password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
