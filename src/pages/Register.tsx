import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';
import { Input, Select, Button, Card } from '../components';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'patient',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // First, create the user in the users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          email: formData.email,
          full_name: formData.fullName,
          role: formData.role,
        })
        .select()
        .single();

      if (userError) {
        console.error('User creation error:', userError);
        throw new Error(`Failed to create user: ${userError.message}`);
      }

      // Then create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role,
          },
        },
      });

      if (authError) {
        // Clean up the users table entry if auth fails
        await supabase
          .from('users')
          .delete()
          .match({ email: formData.email });
        console.error('Auth error:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (authData.user) {
        // Update the users table with the correct auth.uid
        const { error: updateError } = await supabase
          .from('users')
          .update({ id: authData.user.id })
          .match({ email: formData.email });

        if (updateError) {
          console.error('User update error:', updateError);
          throw new Error(`Failed to update user: ${updateError.message}`);
        }

        // Create the user profile
        if (formData.role !== 'receptionist') {
          const { error: profileError } = await supabase
            .from(formData.role === 'patient' ? 'patients' : 'doctors')
            .insert({
              user_id: authData.user.id,
              full_name: formData.fullName,
              ...(formData.role === 'patient' 
                ? {
                    date_of_birth: new Date().toISOString().split('T')[0],
                    gender: 'other',
                    contact_number: 'Not provided',
                    address: 'Not provided',
                  }
                : {
                    specialization: 'Not provided',
                    license_number: `TMP${Math.random().toString(36).substring(7).toUpperCase()}`, // Temporary unique license number
                  }
              ),
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Clean up: Delete the auth user and users table entry
            await supabase.auth.signOut();
            await supabase
              .from('users')
              .delete()
              .match({ email: formData.email });
            throw new Error(`Failed to create profile: ${profileError.message}`);
          }
        }

        toast.success(
          'Registration successful! Please check your email to verify your account.'
        );
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center">
          <img
            className="mx-auto h-12 w-auto"
            src="/logo.svg"
            alt="Clinic Logo"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to your account
            </Link>
          </p>
        </div>

        <Card className="mt-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={handleChange}
              icon={<UserIcon className="h-5 w-5 text-gray-400" />}
            />

            <Input
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
            />

            <Select
              label="Role"
              name="role"
              required
              value={formData.role}
              onChange={handleChange}
              icon={<UserGroupIcon className="h-5 w-5 text-gray-400" />}
              options={[
                { value: 'patient', label: 'Patient' },
                { value: 'doctor', label: 'Doctor' },
                { value: 'receptionist', label: 'Receptionist' },
              ]}
            />

            <div>
              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full"
                size="lg"
              >
                Create account
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
} 