import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, type User } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';

export const Signup = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');

  const onSubmit = (data: Record<string, any>) => {
    setApiError('');
    if (data.password !== data.confirmPassword) {
      setApiError('Passwords do not match');
      return;
    }

    const newUser: User = {
      id: '',
      name: data.name,
      email: data.email,
      password: data.password, // In real app, never store plain text
      role: 'Admin', // Initially Admin as per requirement for company signup
    };

    const success = registerUser(newUser);
    if (success) {
      // Mock creation of company baseline
      localStorage.setItem('company_currency', data.country);
      navigate('/login');
    } else {
      setApiError('User with this email already exists.');
    }
  };

  const countries = [
    { label: 'United States (USD)', value: 'USD' },
    { label: 'India (INR)', value: 'INR' },
    { label: 'Europe (EUR)', value: 'EUR' },
    { label: 'United Kingdom (GBP)', value: 'GBP' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Admin (company) Signup
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Create a new company account and default currency.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Name"
              type="text"
              {...register('name', { required: 'Name is required' })}
              error={errors.name?.message as string}
            />
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
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
              error={errors.password?.message as string}
            />
            <Input
              label="Confirm Password"
              type="password"
              {...register('confirmPassword', { required: 'Confirmation is required' })}
              error={errors.confirmPassword?.message as string}
            />
            <Select
              label="Country selection"
              options={countries}
              {...register('country', { required: 'Please select a country' })}
              error={errors.country?.message as string}
            />
          </div>

          {apiError && <p className="text-red-500 text-sm">{apiError}</p>}

          <Button type="submit" className="w-full">
            Signup
          </Button>

          <div className="text-center text-sm">
            <Link to="/login" className="font-medium text-primary hover:text-blue-500">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
