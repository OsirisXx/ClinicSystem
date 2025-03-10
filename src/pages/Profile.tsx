import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { User, Patient, Doctor } from '../types';

interface ReceptionistProfile {
  full_name: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Patient | Doctor | ReceptionistProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate('/login');
        return;
      }

      // Get user metadata
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // Get profile data based on role
      if (userData.role !== 'receptionist') {
        const table = userData.role === 'patient' ? 'patients' : 'doctors';
        const { data: profileData, error: profileError } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);
      } else {
        setProfile({
          full_name: userData.full_name
        });
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Profile</h3>
            <p className="mt-1 text-sm text-gray-600">
              Your personal information and account settings.
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <div className="shadow sm:rounded-md sm:overflow-hidden">
            <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Account Information</h3>
                <dl className="mt-4 space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Role</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{user?.role}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{profile?.full_name}</dd>
                  </div>
                  {user?.role === 'patient' && (
                    <>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date((profile as Patient)?.date_of_birth).toLocaleDateString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Gender</dt>
                        <dd className="mt-1 text-sm text-gray-900 capitalize">
                          {(profile as Patient)?.gender}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Contact Number</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {(profile as Patient)?.contact_number}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Address</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {(profile as Patient)?.address}
                        </dd>
                      </div>
                    </>
                  )}
                  {user?.role === 'doctor' && (
                    <>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Specialization</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {(profile as Doctor)?.specialization}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">License Number</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {(profile as Doctor)?.license_number}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 sm:px-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 