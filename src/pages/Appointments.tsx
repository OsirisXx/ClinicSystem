import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import type { Doctor, Patient, Appointment, Payment } from '@/types';
import { Badge } from '@/components/ui/badge';

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Pick<Doctor, 'id' | 'full_name' | 'specialization'>[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [patients, setPatients] = useState<Pick<Patient, 'id' | 'full_name'>[]>([]);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [payments, setPayments] = useState<Record<string, Payment>>({});
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [updatingPayment, setUpdatingPayment] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      fetchUserAndProfile();
      fetchDoctors();
      if (user.role === 'receptionist') {
        fetchPatients();
      }
    }
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      fetchAppointments();
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfile?.role === 'receptionist' || userProfile?.role === 'patient') {
      fetchPayments();
    }
  }, [appointments]);

  const fetchUserAndProfile = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', user?.email)
        .single();

      if (userError) throw userError;

      let profileData;
      if (userData.role === 'patient') {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', userData.id)
          .single();
        if (error) throw error;
        profileData = data;
      } else if (userData.role === 'doctor') {
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .eq('user_id', userData.id)
          .single();
        if (error) throw error;
        profileData = data;
      }

      setUserProfile({ ...userData, profile: profileData });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, full_name, specialization');
      
      if (error) throw error;
      setDoctors(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching doctors',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name');
      
      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching patients',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const fetchAppointments = async () => {
    if (!userProfile) return;
    
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctors(id, full_name, specialization),
          patient:patients(id, full_name)
        `);

      if (userProfile.role === 'patient') {
        query = query.eq('patient_id', userProfile.profile.id);
      } else if (userProfile.role === 'doctor') {
        query = query.eq('doctor_id', userProfile.profile.id);
      }

      const { data: appointments, error } = await query.order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(appointments || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching appointments',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .in('appointment_id', appointments.map(a => a.id));

      if (error) throw error;

      const paymentsMap = (data || []).reduce((acc, payment) => {
        acc[payment.appointment_id] = payment;
        return acc;
      }, {} as Record<string, Payment>);

      setPayments(paymentsMap);
    } catch (error: any) {
      toast({
        title: 'Error fetching payments',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const appointmentData = {
        patient_id: userProfile.role === 'patient' ? userProfile.profile.id : selectedPatient,
        doctor_id: selectedDoctor,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        reason: reason,
        status: 'scheduled'
      };

      const { error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Appointment booked successfully'
      });

      // Reset form
      setSelectedDoctor('');
      setSelectedPatient('');
      setAppointmentDate('');
      setAppointmentTime('');
      setReason('');

      // Refresh appointments
      fetchAppointments();
    } catch (error: any) {
      toast({
        title: 'Error booking appointment',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId: string, status: 'scheduled' | 'completed' | 'cancelled') => {
    try {
      setUpdatingStatus(appointmentId);
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      // If marking as completed and no payment exists, create a pending payment
      if (status === 'completed' && !payments[appointmentId]) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            appointment_id: appointmentId,
            patient_id: appointments.find(a => a.id === appointmentId)?.patient_id,
            amount_paid: 0,
            payment_method: 'Cash',
            payment_status: 'Pending',
            transaction_date: new Date().toISOString(),
            processed_by: userProfile.id
          });

        if (paymentError) throw paymentError;
      }

      toast({
        title: 'Success',
        description: `Appointment marked as ${status}`
      });

      fetchAppointments();
      fetchPayments();
    } catch (error: any) {
      toast({
        title: 'Error updating appointment',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleUpdatePaymentStatus = async (
    appointmentId: string, 
    paymentStatus: 'Pending' | 'Completed' | 'Refunded' | 'Failed',
    amount: number = 0,
    paymentMethod: 'Cash' | 'Credit Card' | 'Insurance' | 'Online Payment' = 'Cash'
  ) => {
    try {
      setUpdatingPayment(appointmentId);
      const payment = payments[appointmentId];

      if (payment) {
        // Update existing payment
        const { error } = await supabase
          .from('payments')
          .update({
            payment_status: paymentStatus,
            amount_paid: amount,
            payment_method: paymentMethod,
            transaction_date: new Date().toISOString()
          })
          .eq('id', payment.id);

        if (error) throw error;
      } else {
        // Create new payment
        const { error } = await supabase
          .from('payments')
          .insert({
            appointment_id: appointmentId,
            patient_id: appointments.find(a => a.id === appointmentId)?.patient_id,
            amount_paid: amount,
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            transaction_date: new Date().toISOString(),
            processed_by: userProfile.id
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `Payment status updated to ${paymentStatus}`
      });

      fetchPayments();
    } catch (error: any) {
      toast({
        title: 'Error updating payment',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUpdatingPayment(null);
    }
  };

  if (!user) {
    return <div>Please log in to view appointments</div>;
  }

  const canBookAppointments = userProfile?.role === 'receptionist';
  const showMyAppointments = userProfile?.role === 'patient' || userProfile?.role === 'doctor';

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {showMyAppointments ? 'My Appointments' : 'All Appointments'}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {canBookAppointments && (
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Book Appointment</h2>
            <form onSubmit={handleBookAppointment} className="space-y-4">
              <Select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                required
              >
                <option value="">Select Patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </option>
                ))}
              </Select>

              <Select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                required
              >
                <option value="">Select Doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.full_name} - {doctor.specialization}
                  </option>
                ))}
              </Select>

              <Input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                required
              />

              <Input
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                required
              />

              <Input
                placeholder="Reason for visit"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />

              <Button type="submit" disabled={loading}>
                {loading ? 'Booking...' : 'Book Appointment'}
              </Button>
            </form>
          </Card>
        )}

        <Card className={`p-4 ${!canBookAppointments ? 'md:col-span-2' : ''}`}>
          <h2 className="text-xl font-semibold mb-4">
            {showMyAppointments ? 'My Appointments' : 'All Appointments'}
          </h2>
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className={`p-4 ${
                appointment.status === 'completed' ? 'bg-green-50' :
                appointment.status === 'cancelled' ? 'bg-red-50' :
                'bg-white'
              }`}>
                <div className="flex justify-between items-start">
                  <p className="font-semibold">
                    Dr. {appointment.doctor?.full_name} - {appointment.doctor?.specialization}
                  </p>
                  <Badge variant={
                    appointment.status === 'completed' ? 'success' :
                    appointment.status === 'cancelled' ? 'destructive' :
                    'default'
                  }>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </Badge>
                </div>
                <p>Patient: {appointment.patient?.full_name}</p>
                <p>Date: {new Date(appointment.appointment_date).toLocaleDateString()}</p>
                <p>Time: {appointment.appointment_time}</p>
                <p>Reason: {appointment.reason}</p>
                
                {userProfile?.role === 'receptionist' && (
                  <div className="mt-4 space-y-4">
                    <div className="flex gap-2">
                      <Select
                        value={appointment.status}
                        onChange={(e) => handleUpdateAppointmentStatus(appointment.id, e.target.value as any)}
                        disabled={updatingStatus === appointment.id}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Select
                        value={payments[appointment.id]?.payment_status || 'Pending'}
                        onChange={(e) => handleUpdatePaymentStatus(
                          appointment.id,
                          e.target.value as any,
                          payments[appointment.id]?.amount_paid || 0,
                          payments[appointment.id]?.payment_method || 'Cash'
                        )}
                        disabled={updatingPayment === appointment.id}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Refunded">Refunded</option>
                        <option value="Failed">Failed</option>
                      </Select>

                      {(payments[appointment.id]?.payment_status === 'Pending' || 
                        !payments[appointment.id]) && (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Amount"
                            min="0"
                            step="0.01"
                            value={payments[appointment.id]?.amount_paid || ''}
                            onChange={(e) => {
                              const amount = parseFloat(e.target.value);
                              handleUpdatePaymentStatus(
                                appointment.id,
                                'Pending',
                                amount,
                                payments[appointment.id]?.payment_method || 'Cash'
                              );
                            }}
                          />
                          <Select
                            value={payments[appointment.id]?.payment_method || 'Cash'}
                            onChange={(e) => handleUpdatePaymentStatus(
                              appointment.id,
                              payments[appointment.id]?.payment_status || 'Pending',
                              payments[appointment.id]?.amount_paid || 0,
                              e.target.value as any
                            )}
                          >
                            <option value="Cash">Cash</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Insurance">Insurance</option>
                            <option value="Online Payment">Online Payment</option>
                          </Select>
                        </div>
                      )}
                    </div>

                    {payments[appointment.id] && (
                      <div className="text-sm text-gray-600">
                        <p>Payment Status: {payments[appointment.id].payment_status}</p>
                        <p>Amount: ${payments[appointment.id].amount_paid}</p>
                        <p>Method: {payments[appointment.id].payment_method}</p>
                        <p>Last Updated: {new Date(payments[appointment.id].transaction_date).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                )}

                {userProfile?.role === 'patient' && payments[appointment.id] && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <h3 className="font-medium text-gray-900 mb-2">Payment Information</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant={
                          payments[appointment.id].payment_status === 'Completed' ? 'success' :
                          payments[appointment.id].payment_status === 'Failed' ? 'destructive' :
                          payments[appointment.id].payment_status === 'Refunded' ? 'warning' :
                          'default'
                        }>
                          {payments[appointment.id].payment_status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">${payments[appointment.id].amount_paid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Method:</span>
                        <span>{payments[appointment.id].payment_method}</span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
            {appointments.length === 0 && (
              <p>No appointments found</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
} 