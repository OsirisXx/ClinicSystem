export type UserRole = 'patient' | 'doctor' | 'admin' | 'receptionist';
export type Gender = 'male' | 'female' | 'other';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';
export type PaymentMethod = 'Cash' | 'Credit Card' | 'Insurance' | 'Online Payment';
export type PaymentStatus = 'Pending' | 'Completed' | 'Refunded' | 'Failed';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  full_name: string;
  specialization: string;
  license_number: string;
  created_at?: string;
  updated_at?: string;
}

export interface Patient {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  gender: Gender;
  contact_number: string;
  address: string;
  medical_history?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  doctor?: Doctor;
  patient?: Patient;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string;
  diagnosis: string;
  prescription?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  appointment_id: string;
  patient_id: string;
  amount_paid: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_date: string;
  processed_by: string;
} 