/**
 * FHIR Resource Validator
 */

export interface ValidationResult {
  valid: boolean
  errors?: string[]
}

export function validateFHIR(resource: any, resourceType: string): ValidationResult {
  const errors: string[] = []

  // Basic validation
  if (!resource.resourceType) {
    errors.push('resourceType is required')
  } else if (resource.resourceType !== resourceType) {
    errors.push(`Expected resourceType '${resourceType}', got '${resource.resourceType}'`)
  }

  // Type-specific validation
  switch (resourceType) {
    case 'Patient':
      validatePatient(resource, errors)
      break
    case 'Encounter':
      validateEncounter(resource, errors)
      break
    case 'Observation':
      validateObservation(resource, errors)
      break
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}

function validatePatient(patient: any, errors: string[]): void {
  if (!patient.identifier && !patient.name) {
    errors.push('Patient must have at least identifier or name')
  }

  if (patient.gender && !['male', 'female', 'other', 'unknown'].includes(patient.gender)) {
    errors.push('Invalid gender value')
  }

  if (patient.birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(patient.birthDate)) {
    errors.push('birthDate must be in YYYY-MM-DD format')
  }
}

function validateEncounter(encounter: any, errors: string[]): void {
  if (!encounter.status) {
    errors.push('Encounter.status is required')
  }

  if (!encounter.class) {
    errors.push('Encounter.class is required')
  }

  if (!encounter.subject) {
    errors.push('Encounter.subject (patient reference) is required')
  }
}

function validateObservation(observation: any, errors: string[]): void {
  if (!observation.status) {
    errors.push('Observation.status is required')
  }

  if (!observation.code) {
    errors.push('Observation.code is required')
  }

  if (!observation.subject) {
    errors.push('Observation.subject (patient reference) is required')
  }
}
