/**
 * FHIR ↔ Notion Sync Service
 * Bidirectional sync between FHIR Patient resources and Notion Patients database
 */

import { Client } from '@notionhq/client'

interface FHIRPatient {
  id: string
  name: { given: string[]; family: string }[]
  birthDate?: string
  gender?: string
  telecom?: { system: string; value: string }[]
  address?: any[]
}

interface NotionPatient {
  id: string
  name: string
  age?: number
  status?: string
  phone?: string
  email?: string
}

export class NotionFHIRSync {
  constructor(
    private notion: Client,
    private fhirBaseUrl: string,
    private patientsDatabaseId: string
  ) {}

  /**
   * Sync FHIR Patient → Notion
   */
  async syncFHIRPatientToNotion(fhirPatient: FHIRPatient): Promise<void> {
    const name = fhirPatient.name?.[0]
    const fullName = name ? `${name.given.join(' ')} ${name.family}` : 'Unknown'
    
    const age = fhirPatient.birthDate 
      ? new Date().getFullYear() - new Date(fhirPatient.birthDate).getFullYear()
      : undefined

    const phone = fhirPatient.telecom?.find(t => t.system === 'phone')?.value
    const email = fhirPatient.telecom?.find(t => t.system === 'email')?.value

    // Search for existing Notion page by FHIR ID
    const existing = await this.findNotionPatientByFHIRId(fhirPatient.id)

    const properties: any = {
      Name: { title: [{ text: { content: fullName } }] },
      'FHIR ID': { rich_text: [{ text: { content: fhirPatient.id } }] },
      Status: { status: { name: 'Active' } }
    }

    if (age) properties.Age = { number: age }
    if (phone) properties.Phone = { phone_number: phone }
    if (email) properties.Email = { email }
    if (fhirPatient.gender) {
      properties.Gender = { select: { name: fhirPatient.gender } }
    }

    if (existing) {
      // Update existing
      await this.notion.pages.update({
        page_id: existing.id,
        properties
      })
    } else {
      // Create new
      await this.notion.pages.create({
        parent: { database_id: this.patientsDatabaseId },
        properties
      })
    }
  }

  /**
   * Sync Notion Patient → FHIR
   */
  async syncNotionPatientToFHIR(notionPageId: string): Promise<void> {
    const page = await this.notion.pages.retrieve({ page_id: notionPageId }) as any
    const props = page.properties

    const name = props.Name?.title?.[0]?.plain_text || 'Unknown'
    const fhirId = props['FHIR ID']?.rich_text?.[0]?.plain_text
    const age = props.Age?.number
    const phone = props.Phone?.phone_number
    const email = props.Email?.email
    const gender = props.Gender?.select?.name?.toLowerCase()

    const [given, ...familyParts] = name.split(' ')
    const family = familyParts.join(' ') || given

    const fhirPatient: any = {
      resourceType: 'Patient',
      name: [{ given: [given], family }],
      telecom: []
    }

    if (fhirId) fhirPatient.id = fhirId
    if (age) {
      const year = new Date().getFullYear() - age
      fhirPatient.birthDate = `${year}-01-01`
    }
    if (gender) fhirPatient.gender = gender
    if (phone) fhirPatient.telecom.push({ system: 'phone', value: phone })
    if (email) fhirPatient.telecom.push({ system: 'email', value: email })

    // PUT to FHIR server
    const method = fhirId ? 'PUT' : 'POST'
    const url = fhirId 
      ? `${this.fhirBaseUrl}/Patient/${fhirId}`
      : `${this.fhirBaseUrl}/Patient`

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/fhir+json' },
      body: JSON.stringify(fhirPatient)
    })
  }

  /**
   * Find Notion patient by FHIR ID property
   */
  private async findNotionPatientByFHIRId(fhirId: string): Promise<any> {
    const response = await this.notion.databases.query({
      database_id: this.patientsDatabaseId,
      filter: {
        property: 'FHIR ID',
        rich_text: { equals: fhirId }
      }
    })
    return response.results[0] || null
  }

  /**
   * Bulk sync: all FHIR patients → Notion
   */
  async syncAllFHIRToNotion(): Promise<{ synced: number; errors: number }> {
    let synced = 0
    let errors = 0

    try {
      const response = await fetch(`${this.fhirBaseUrl}/Patient?_count=100`)
      const bundle = await response.json()

      for (const entry of bundle.entry || []) {
        try {
          await this.syncFHIRPatientToNotion(entry.resource)
          synced++
        } catch (err) {
          console.error(`Failed to sync patient ${entry.resource.id}:`, err)
          errors++
        }
      }
    } catch (err) {
      console.error('Failed to fetch FHIR patients:', err)
      errors++
    }

    return { synced, errors }
  }
}
