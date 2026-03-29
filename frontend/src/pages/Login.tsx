import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { sendPasswordEmail } from '../services/mockData';

export const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login, getUsers } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [apiError, setApiError] = useState('');
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  const onSubmit = (data: Record<string, any>) => {
    setApiError('');
    const users = getUsers();
    const foundUser = users.find(u => u.email === data.email && u.password === data.password);
    
    // If no users exist, allow fallback mock admin for seamless testing given backend doesn't exist
    if (getUsers().length === 0 && data.email === 'admin@admin.com') {
        const adminFallback = {
            id: 'mock-1', name: 'Admin Fallback', email: 'admin@admin.com', role: 'Admin'
        };
        login('mock-jwt-token', adminFallback as unknown as any);
        navigate('/');
        return;
    }

    if (foundUser) {
        // Strip out password and login
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...safeUser } = foundUser;
        login('mock-jwt-token-abcd', safeUser as unknown as any);
        navigate(location.state?.from || '/');
    } else {
        setApiError('Invalid credentials. (Hint: Please sign up first)');
    }
  };

  const handleForgotPassword = () => {
    const users = getUsers();
    const foundUser = users.find((u) => u.email === forgotEmail);
    if (!foundUser) {
      setForgotMessage('No user found with this email.');
      return;
    }
    const tempPassword = sendPasswordEmail(forgotEmail);
    setForgotMessage(`Temporary password sent: ${tempPassword}`);
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

          <Button type="submit" className="w-full">
            Login
          </Button>

          <div className="flex items-center justify-between text-sm mt-4">
            <Link to="/signup" className="font-medium text-primary hover:text-blue-500 transition-colors">
              Don't have an account? Signup
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsForgotOpen(true);
                setForgotMessage('');
              }}
              className="font-medium text-gray-500 hover:text-gray-900"
            >
              Forgot password?
            </button>
          </div>
        </form>
      </div>

      <Modal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} title="Reset Password">
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="Enter your registered email"
          />
          {forgotMessage && <p className="text-sm text-gray-600">{forgotMessage}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsForgotOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleForgotPassword}>
              Send Password
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
