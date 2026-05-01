import type { PlatformFetch } from '../core/openapi-client'
import { extractData } from '../../core/utils'
import type { components, operations } from '../../generated/platform-api-types'
import type { WorkspaceId } from '../core/branded-types'

/** Resource for managing FHIR health data. */
export class FhirResource {
  constructor(
    private c: PlatformFetch,
    private workspaceId: WorkspaceId
  ) {}

  /** Get FHIR store status for the workspace. */
  async status() {
    return extractData(
      this.c.GET('/v1/{workspace_id}/fhir/status', {
        params: { path: { workspace_id: this.workspaceId } },
      })
    )
  }

  /** Search FHIR resources by type. */
  async searchResources(options: {
    resourceType: string
    query?: operations['fhir-search-resources']['parameters']['query']
  }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/fhir/resources/{resource_type}', {
        params: {
          path: { workspace_id: this.workspaceId, resource_type: options.resourceType },
          query: options.query,
        },
      })
    )
  }

  /** Get a specific FHIR resource by type and ID. */
  async getResource(options: { resourceType: string; resourceId: string }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/fhir/resources/{resource_type}/{resource_id}', {
        params: {
          path: {
            workspace_id: this.workspaceId,
            resource_type: options.resourceType,
            resource_id: options.resourceId,
          },
        },
      })
    )
  }

  /** Create a FHIR resource. */
  async createResource(options: { resourceType: string; body: Record<string, unknown> }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/fhir/resources/{resource_type}', {
        params: {
          path: { workspace_id: this.workspaceId, resource_type: options.resourceType },
        },
        body: options.body as components['schemas']['FhirWriteRequest'],
      })
    )
  }

  /** Update a FHIR resource. */
  async updateResource(options: {
    resourceType: string
    resourceId: string
    body: Record<string, unknown>
  }) {
    return extractData(
      this.c.PUT('/v1/{workspace_id}/fhir/resources/{resource_type}/{resource_id}', {
        params: {
          path: {
            workspace_id: this.workspaceId,
            resource_type: options.resourceType,
            resource_id: options.resourceId,
          },
        },
        body: options.body as components['schemas']['FhirWriteRequest'],
      })
    )
  }

  /** Get sync failures. */
  async syncFailures(options?: {
    query?: operations['fhir-sync-failures']['parameters']['query']
  }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/fhir/sync-failures', {
        params: { path: { workspace_id: this.workspaceId }, query: options?.query },
      })
    )
  }

  /** Import FHIR data. */
  async import(options: { body: components['schemas']['FhirImportRequest'] }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/fhir/import', {
        params: { path: { workspace_id: this.workspaceId } },
        body: options.body,
      })
    )
  }

  /** Search patients. */
  async searchPatients(options?: {
    query?: operations['fhir-patient-search']['parameters']['query']
  }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/fhir/patients', {
        params: { path: { workspace_id: this.workspaceId }, query: options?.query },
      })
    )
  }

  /** Get patient timeline. */
  async getPatientTimeline(options: {
    patientId: string
    query?: operations['fhir-patient-timeline']['parameters']['query']
  }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/fhir/patients/{patient_id}/timeline', {
        params: {
          path: { workspace_id: this.workspaceId, patient_id: options.patientId },
          query: options.query,
        },
      })
    )
  }

  /** Get patient summary. */
  async getPatientSummary(options: { patientId: string }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/fhir/patients/{patient_id}/summary', {
        params: {
          path: { workspace_id: this.workspaceId, patient_id: options.patientId },
        },
      })
    )
  }

  /** Get FHIR views — patients. */
  async viewPatients(options?: {
    query?: operations['fhir-patients-view']['parameters']['query']
  }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/fhir/views/patients', {
        params: { path: { workspace_id: this.workspaceId }, query: options?.query },
      })
    )
  }

  /** Get FHIR views — practitioners. */
  async viewPractitioners(options?: {
    query?: operations['fhir-practitioners-view']['parameters']['query']
  }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/fhir/views/practitioners', {
        params: { path: { workspace_id: this.workspaceId }, query: options?.query },
      })
    )
  }

  /** Get FHIR views — locations. */
  async viewLocations(options?: {
    query?: operations['fhir-locations-view']['parameters']['query']
  }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/fhir/views/locations', {
        params: { path: { workspace_id: this.workspaceId }, query: options?.query },
      })
    )
  }

  /** Get FHIR views — appointments. */
  async viewAppointments(options?: {
    query?: operations['fhir-appointments-view']['parameters']['query']
  }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/fhir/views/appointments', {
        params: { path: { workspace_id: this.workspaceId }, query: options?.query },
      })
    )
  }

  /** Get FHIR views — organizations. */
  async viewOrganizations(options?: {
    query?: operations['fhir-organizations-view']['parameters']['query']
  }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/fhir/views/organizations', {
        params: { path: { workspace_id: this.workspaceId }, query: options?.query },
      })
    )
  }

  /** Get FHIR views — slots. */
  async viewSlots(options?: { query?: operations['fhir-slots-view']['parameters']['query'] }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/fhir/views/slots', {
        params: { path: { workspace_id: this.workspaceId }, query: options?.query },
      })
    )
  }
}
