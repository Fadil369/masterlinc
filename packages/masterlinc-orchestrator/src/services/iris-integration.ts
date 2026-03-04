/**
 * InterSystems IRIS for Health Integration
 * FHIR R4 REST client for the MasterLinc medical imaging orchestrator.
 *
 * Manages Patient, ImagingStudy, DiagnosticReport, Appointment, and
 * Practitioner resources in the centralised IRIS for Health FHIR server.
 */

import axios, { type AxiosInstance } from 'axios';
import { pino } from 'pino';

const logger = pino({ name: 'iris-integration' });

// ---------------------------------------------------------------------------
// FHIR R4 resource types (minimal subset used by MasterLinc)
// ---------------------------------------------------------------------------
export interface FHIRPatient {
  resourceType: 'Patient';
  id?: string;
  identifier?: Array<{ system: string; value: string }>;
  name?: Array<{ family?: string; given?: string[] }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  telecom?: Array<{ system: string; value: string; use?: string }>;
}

export interface FHIRImagingStudy {
  resourceType: 'ImagingStudy';
  id?: string;
  status: 'registered' | 'available' | 'cancelled' | 'entered-in-error';
  subject: { reference: string };
  started?: string;
  description?: string;
  numberOfSeries?: number;
  numberOfInstances?: number;
  modality?: Array<{ system: string; code: string }>;
  series?: Array<{
    uid: string;
    modality: { system: string; code: string };
    numberOfInstances: number;
  }>;
}

export interface FHIRDiagnosticReport {
  resourceType: 'DiagnosticReport';
  id?: string;
  status: 'registered' | 'partial' | 'preliminary' | 'final' | 'amended';
  category?: Array<{ coding: Array<{ system: string; code: string }> }>;
  code: { coding: Array<{ system: string; code: string; display?: string }> };
  subject: { reference: string };
  issued?: string;
  conclusion?: string;
  imagingStudy?: Array<{ reference: string }>;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  type: 'transaction' | 'searchset' | 'collection';
  entry?: Array<{ resource?: Record<string, unknown>; fullUrl?: string }>;
}

export interface IRISHealthStatus {
  reachable: boolean;
  fhirVersion?: string;
  statusCode?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// IRISIntegration service
// ---------------------------------------------------------------------------
export class IRISIntegration {
  private client: AxiosInstance;
  private baseUrl: string;
  private enabled: boolean;

  constructor(config?: { baseUrl?: string; username?: string; password?: string; enabled?: boolean }) {
    const irisHost = process.env.IRIS_HOST ?? 'iris';
    const irisPort = process.env.IRIS_PORT ?? '52773';
    this.baseUrl =
      config?.baseUrl ??
      process.env.IRIS_FHIR_BASE_URL ??
      `http://${irisHost}:${irisPort}/fhir/r4`;

    this.enabled = config?.enabled ?? (process.env.IRIS_ENABLED ?? 'true') === 'true';

    const username = config?.username ?? process.env.IRIS_USERNAME ?? 'SuperUser';
    const password = config?.password ?? process.env.IRIS_PASSWORD ?? 'SYS';

    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: { username, password },
      headers: {
        'Content-Type': 'application/fhir+json',
        Accept: 'application/fhir+json',
      },
      timeout: parseInt(process.env.IRIS_TIMEOUT_MS ?? '10000'),
    });

    if (this.enabled) {
      logger.info({ baseUrl: this.baseUrl }, 'IRIS for Health integration initialised');
    }
  }

  // -------------------------------------------------------------------------
  // Health check
  // -------------------------------------------------------------------------
  async healthCheck(): Promise<IRISHealthStatus> {
    if (!this.enabled) return { reachable: false, error: 'IRIS integration disabled' };
    try {
      const resp = await this.client.get('/metadata');
      return {
        reachable: true,
        fhirVersion: (resp.data as Record<string, string>)?.fhirVersion,
        statusCode: resp.status,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn({ err: message }, 'IRIS health check failed');
      return { reachable: false, error: message };
    }
  }

  // -------------------------------------------------------------------------
  // Generic FHIR helpers
  // -------------------------------------------------------------------------
  private async conditionalPut<T extends { resourceType: string }>(
    resource: T,
    conditionalUrl: string,
  ): Promise<T | null> {
    if (!this.enabled) return null;
    try {
      const resp = await this.client.put<T>(conditionalUrl, resource);
      return resp.data;
    } catch (err: unknown) {
      logger.warn({ err: (err as Error).message, conditionalUrl }, 'IRIS conditional PUT failed (non-fatal)');
      return null;
    }
  }

  private async search<T>(resourceType: string, params: Record<string, string>): Promise<T[]> {
    if (!this.enabled) return [];
    try {
      const resp = await this.client.get<FHIRBundle>(`/${resourceType}`, { params });
      return (resp.data.entry ?? []).map((e) => e.resource as T);
    } catch (err: unknown) {
      logger.warn({ err: (err as Error).message, resourceType }, 'IRIS search failed (non-fatal)');
      return [];
    }
  }

  // -------------------------------------------------------------------------
  // Patient management
  // -------------------------------------------------------------------------

  /**
   * Upsert a Patient using national ID as the conditional identifier.
   * Used to keep the IRIS FHIR server in sync with MasterLinc patient records.
   */
  async syncPatient(patient: {
    id: string;
    oid?: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: string;
    phone: string;
    email?: string;
    nationalId?: string;
  }): Promise<FHIRPatient | null> {
    const resource: FHIRPatient = {
      resourceType: 'Patient',
      identifier: [
        { system: 'http://masterlinc.brainsait.cloud/identifier/patient-id', value: patient.id },
        ...(patient.nationalId
          ? [{ system: 'http://nphies.sa/identifier/nationalid', value: patient.nationalId }]
          : []),
        ...(patient.oid
          ? [{ system: 'urn:ietf:rfc:3986', value: patient.oid }]
          : []),
      ],
      name: [{ family: patient.lastName, given: [patient.firstName] }],
      gender: patient.gender as FHIRPatient['gender'],
      birthDate: patient.dateOfBirth.toISOString().split('T')[0],
      telecom: [
        { system: 'phone', value: patient.phone, use: 'mobile' },
        ...(patient.email ? [{ system: 'email', value: patient.email }] : []),
      ],
    };

    const conditionalUrl =
      `Patient?identifier=http://masterlinc.brainsait.cloud/identifier/patient-id|${patient.id}`;
    const result = await this.conditionalPut(resource, conditionalUrl);
    if (result) {
      logger.info({ patientId: patient.id }, 'Patient synced to IRIS');
    }
    return result;
  }

  async findPatient(nationalId: string): Promise<FHIRPatient[]> {
    return this.search<FHIRPatient>('Patient', {
      identifier: `http://nphies.sa/identifier/nationalid|${nationalId}`,
    });
  }

  // -------------------------------------------------------------------------
  // Imaging studies
  // -------------------------------------------------------------------------

  async storeImagingStudy(study: {
    id: string;
    patientId: string;
    started: Date;
    description?: string;
    modality: string;
    numberOfSeries?: number;
    numberOfInstances?: number;
  }): Promise<FHIRImagingStudy | null> {
    const resource: FHIRImagingStudy = {
      resourceType: 'ImagingStudy',
      status: 'available',
      subject: { reference: `Patient/${study.patientId}` },
      started: study.started.toISOString(),
      description: study.description,
      numberOfSeries: study.numberOfSeries ?? 1,
      numberOfInstances: study.numberOfInstances ?? 1,
      modality: [
        {
          system: 'http://dicom.nema.org/resources/ontology/DCM',
          code: study.modality,
        },
      ],
    };
    return this.conditionalPut(
      resource,
      `ImagingStudy?identifier=http://masterlinc.brainsait.cloud/identifier/study-id|${study.id}`,
    );
  }

  // -------------------------------------------------------------------------
  // Diagnostic reports
  // -------------------------------------------------------------------------

  async storeDiagnosticReport(report: {
    id: string;
    patientId: string;
    studyId?: string;
    status?: FHIRDiagnosticReport['status'];
    conclusion?: string;
    issued?: Date;
  }): Promise<FHIRDiagnosticReport | null> {
    const resource: FHIRDiagnosticReport = {
      resourceType: 'DiagnosticReport',
      status: report.status ?? 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
              code: 'RAD',
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '18748-4',
            display: 'Diagnostic imaging study',
          },
        ],
      },
      subject: { reference: `Patient/${report.patientId}` },
      issued: (report.issued ?? new Date()).toISOString(),
      conclusion: report.conclusion,
      ...(report.studyId
        ? { imagingStudy: [{ reference: `ImagingStudy/${report.studyId}` }] }
        : {}),
    };
    return this.conditionalPut(
      resource,
      `DiagnosticReport?identifier=http://masterlinc.brainsait.cloud/identifier/report-id|${report.id}`,
    );
  }

  // -------------------------------------------------------------------------
  // Appointments
  // -------------------------------------------------------------------------

  async storeAppointment(appt: {
    id: string;
    patientId: string;
    practitionerId: string;
    start: Date;
    end: Date;
    status: string;
    serviceType?: string;
    department?: string;
  }): Promise<Record<string, unknown> | null> {
    const resource: Record<string, unknown> = {
      resourceType: 'Appointment',
      status: appt.status,
      serviceType: appt.serviceType
        ? [{ coding: [{ display: appt.serviceType }] }]
        : undefined,
      specialty: appt.department
        ? [{ coding: [{ display: appt.department }] }]
        : undefined,
      start: appt.start.toISOString(),
      end: appt.end.toISOString(),
      participant: [
        {
          actor: { reference: `Patient/${appt.patientId}` },
          status: 'accepted',
        },
        {
          actor: { reference: `Practitioner/${appt.practitionerId}` },
          status: 'accepted',
        },
      ],
    };
    return this.conditionalPut(
      resource as { resourceType: string },
      `Appointment?identifier=http://masterlinc.brainsait.cloud/identifier/appointment-id|${appt.id}`,
    ) as Promise<Record<string, unknown> | null>;
  }
}
