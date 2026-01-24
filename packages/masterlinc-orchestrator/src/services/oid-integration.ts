/**
 * BrainSAIT OID Integration
 * Handles OID generation, credentials, identity management, and access control
 */

import axios from 'axios';
import pino from 'pino';
import type { ServiceRegistry } from './service-registry.js';

const logger = pino({ name: 'oid-integration' });

export interface OIDRecord {
  oid: string;
  entityType: 'patient' | 'provider' | 'organization' | 'facility';
  entityId: string;
  issuedAt: Date;
  expiresAt?: Date;
  status: 'active' | 'suspended' | 'revoked';
  metadata: Record<string, any>;
}

export interface Credential {
  credentialId: string;
  oid: string;
  type: 'access_token' | 'api_key' | 'certificate';
  value: string;
  permissions: string[];
  issuedAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'revoked';
}

export interface ResourceDefinition {
  resourceId: string;
  oid: string;
  resourceType: 'patient_record' | 'medical_image' | 'prescription' | 'lab_result';
  uri: string;
  accessControl: {
    owner: string;
    readers: string[];
    writers: string[];
  };
  metadata: Record<string, any>;
}

export class OIDIntegration {
  private oidUrl: string;

  constructor(private registry: ServiceRegistry) {
    const oidService = registry.getService('brainsait-oid');
    this.oidUrl = oidService?.url || '';
  }

  /**
   * Generate new OID for entity
   */
  async generateOID(params: {
    entityType: OIDRecord['entityType'];
    entityId: string;
    metadata?: Record<string, any>;
  }): Promise<OIDRecord> {
    logger.info({ entityType: params.entityType, entityId: params.entityId }, 'Generating OID');

    try {
      const response = await axios.post(`${this.oidUrl}/api/oid/generate`, params, {
        timeout: 10000,
      });

      logger.info({ oid: response.data.oid }, 'OID generated successfully');
      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to generate OID');
      throw new Error(`Failed to generate OID: ${error.message}`);
    }
  }

  /**
   * Lookup OID by entity ID
   */
  async lookupOID(entityId: string): Promise<OIDRecord | null> {
    logger.info({ entityId }, 'Looking up OID');

    try {
      const response = await axios.get(`${this.oidUrl}/api/oid/lookup/${entityId}`, {
        timeout: 5000,
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.info({ entityId }, 'OID not found');
        return null;
      }

      logger.error({ error: error.message }, 'Failed to lookup OID');
      throw new Error(`Failed to lookup OID: ${error.message}`);
    }
  }

  /**
   * Issue credentials for an OID
   */
  async issueCredential(params: {
    oid: string;
    type: Credential['type'];
    permissions: string[];
    expiresIn?: number; // seconds
  }): Promise<Credential> {
    logger.info({ oid: params.oid, type: params.type }, 'Issuing credential');

    try {
      const response = await axios.post(`${this.oidUrl}/api/credentials/issue`, params, {
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to issue credential');
      throw new Error(`Failed to issue credential: ${error.message}`);
    }
  }

  /**
   * Validate credential
   */
  async validateCredential(credentialId: string): Promise<{
    valid: boolean;
    credential?: Credential;
    reason?: string;
  }> {
    logger.info({ credentialId }, 'Validating credential');

    try {
      const response = await axios.post(
        `${this.oidUrl}/api/credentials/validate`,
        { credentialId },
        { timeout: 5000 },
      );

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to validate credential');
      return {
        valid: false,
        reason: error.message,
      };
    }
  }

  /**
   * Create resource with access control
   */
  async createResource(params: {
    oid: string;
    resourceType: ResourceDefinition['resourceType'];
    uri: string;
    owner: string;
    readers?: string[];
    writers?: string[];
    metadata?: Record<string, any>;
  }): Promise<ResourceDefinition> {
    logger.info({ oid: params.oid, resourceType: params.resourceType }, 'Creating resource');

    try {
      const response = await axios.post(`${this.oidUrl}/api/resources/create`, params, {
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to create resource');
      throw new Error(`Failed to create resource: ${error.message}`);
    }
  }

  /**
   * Check access permission
   */
  async checkAccess(params: {
    credentialId: string;
    resourceId: string;
    action: 'read' | 'write' | 'delete';
  }): Promise<{ allowed: boolean; reason?: string }> {
    logger.info(
      { resourceId: params.resourceId, action: params.action },
      'Checking access permission',
    );

    try {
      const response = await axios.post(`${this.oidUrl}/api/access/check`, params, {
        timeout: 5000,
      });

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to check access');
      return {
        allowed: false,
        reason: error.message,
      };
    }
  }

  /**
   * Get all resources for an OID
   */
  async getResources(oid: string): Promise<ResourceDefinition[]> {
    logger.info({ oid }, 'Fetching resources for OID');

    try {
      const response = await axios.get(`${this.oidUrl}/api/resources/oid/${oid}`, {
        timeout: 5000,
      });

      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to fetch resources');
      return [];
    }
  }

  /**
   * Revoke credential
   */
  async revokeCredential(credentialId: string, reason: string): Promise<boolean> {
    logger.info({ credentialId }, 'Revoking credential');

    try {
      await axios.post(
        `${this.oidUrl}/api/credentials/revoke`,
        { credentialId, reason },
        { timeout: 5000 },
      );

      return true;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to revoke credential');
      return false;
    }
  }

  /**
   * Audit log access
   */
  async logAccess(params: {
    credentialId: string;
    resourceId: string;
    action: string;
    result: 'allowed' | 'denied';
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await axios.post(`${this.oidUrl}/api/audit/log`, params, {
        timeout: 5000,
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to log access');
    }
  }
}
