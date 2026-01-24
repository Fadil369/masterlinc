/**
 * BrainSAIT Healthcare Integration
 * Handles patient management, booking, triage, and appointments
 */

import axios from 'axios';
import pino from 'pino';
import type { ServiceRegistry } from './service-registry.js';

const logger = pino({ name: 'healthcare-integration' });

export interface Patient {
  id: string;
  oid?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  nationalId?: string;
  medicalHistory?: string[];
}

export interface TriageData {
  patientId: string;
  symptoms: string[];
  severity: 'emergency' | 'urgent' | 'routine';
  vitalSigns?: {
    temperature?: number;
    bloodPressure?: string;
    heartRate?: number;
    respiratoryRate?: number;
  };
  chiefComplaint: string;
  duration: string;
  assessment: string;
  recommendedAction: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  datetime: Date;
  duration: number;
  type: 'consultation' | 'follow-up' | 'procedure' | 'emergency';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  department: string;
  notes?: string;
}

export class HealthcareIntegration {
  private healthcareUrl: string;

  constructor(private registry: ServiceRegistry) {
    const healthcareService = registry.getService('brainsait-healthcare');
    this.healthcareUrl = healthcareService?.url || '';
  }

  /**
   * Create or update patient record
   */
  async upsertPatient(patient: Partial<Patient>): Promise<Patient> {
    logger.info({ patientPhone: patient.phone }, 'Upserting patient record');

    try {
      const response = await axios.post(`${this.healthcareUrl}/api/patients`, patient, {
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to upsert patient');
      throw new Error(`Failed to upsert patient: ${error.message}`);
    }
  }

  /**
   * Get patient by phone number
   */
  async getPatientByPhone(phone: string): Promise<Patient | null> {
    logger.info({ phone }, 'Looking up patient by phone');

    try {
      const response = await axios.get(`${this.healthcareUrl}/api/patients/phone/${phone}`, {
        timeout: 5000,
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.info({ phone }, 'Patient not found');
        return null;
      }
      
      logger.error({ error: error.message }, 'Failed to fetch patient');
      throw new Error(`Failed to fetch patient: ${error.message}`);
    }
  }

  /**
   * Perform AI-guided triage
   */
  async performTriage(params: {
    patientId: string;
    symptoms: string[];
    chiefComplaint: string;
    additionalInfo?: Record<string, any>;
  }): Promise<TriageData> {
    logger.info({ patientId: params.patientId }, 'Performing triage assessment');

    try {
      const response = await axios.post(`${this.healthcareUrl}/api/triage/assess`, params, {
        timeout: 15000,
      });

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to perform triage');
      throw new Error(`Failed to perform triage: ${error.message}`);
    }
  }

  /**
   * Check doctor availability
   */
  async checkAvailability(params: {
    doctorId?: string;
    department?: string;
    date: Date;
    duration: number;
  }): Promise<Date[]> {
    logger.info({ department: params.department, date: params.date }, 'Checking availability');

    try {
      const response = await axios.post(
        `${this.healthcareUrl}/api/appointments/availability`,
        params,
        { timeout: 5000 },
      );

      return response.data.availableSlots.map((slot: string) => new Date(slot));
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to check availability');
      return [];
    }
  }

  /**
   * Book appointment
   */
  async bookAppointment(params: {
    patientId: string;
    doctorId: string;
    datetime: Date;
    type: Appointment['type'];
    department: string;
    notes?: string;
  }): Promise<Appointment> {
    logger.info(
      { patientId: params.patientId, datetime: params.datetime },
      'Booking appointment',
    );

    try {
      const response = await axios.post(`${this.healthcareUrl}/api/appointments`, params, {
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to book appointment');
      throw new Error(`Failed to book appointment: ${error.message}`);
    }
  }

  /**
   * Get patient appointments
   */
  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    logger.info({ patientId }, 'Fetching patient appointments');

    try {
      const response = await axios.get(
        `${this.healthcareUrl}/api/patients/${patientId}/appointments`,
        { timeout: 5000 },
      );

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to fetch appointments');
      return [];
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId: string, reason: string): Promise<boolean> {
    logger.info({ appointmentId }, 'Cancelling appointment');

    try {
      await axios.post(
        `${this.healthcareUrl}/api/appointments/${appointmentId}/cancel`,
        { reason },
        { timeout: 5000 },
      );

      return true;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to cancel appointment');
      return false;
    }
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(department: string): Promise<any> {
    logger.info({ department }, 'Fetching department statistics');

    try {
      const response = await axios.get(
        `${this.healthcareUrl}/api/departments/${department}/statistics`,
        { timeout: 5000 },
      );

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to fetch department stats');
      return null;
    }
  }
}
