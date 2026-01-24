/**
 * Service Registry
 * Manages registration, discovery, and health monitoring of all subsystems
 */

import axios from 'axios';
import { pino } from 'pino';

const logger = pino({ name: 'service-registry' });

export interface ServiceEndpoint {
  id: string;
  name: string;
  url: string;
  healthEndpoint: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  metadata: {
    version?: string;
    region?: string;
    capabilities?: string[];
  };
}

export class ServiceRegistry {
  private services: Map<string, ServiceEndpoint> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeServices();
  }

  /**
   * Initialize all known services
   */
  private initializeServices() {
      {
        id: 'masterlinc-healthcare',
        name: 'MasterLinc Healthcare',
        url: 'https://masterlinc-agent-pla--Fadil369.github.app',
        healthEndpoint: '/health',
        status: 'unknown',
        lastCheck: new Date(),
        metadata: {
          capabilities: ['healthcare', 'triage', 'booking'],
        },
      },
      {
        id: 'masterlinc-business',
        name: 'MasterLinc Business',
        url: 'https://masterlinc-business--Fadil369.github.app',
        healthEndpoint: '/health',
        status: 'unknown',
        lastCheck: new Date(),
        metadata: {
          capabilities: ['business', 'strategy', 'finance', 'marketing'],
        },
      },
      {
        id: 'masterlinc-tech',
        name: 'MasterLinc Tech',
        url: 'https://masterlinc-tech--Fadil369.github.app',
        healthEndpoint: '/health',
        status: 'unknown',
        lastCheck: new Date(),
        metadata: {
          capabilities: ['tech', 'development', 'devops', 'ai-ml'],
        },
      },
      {
        id: 'masterlinc-personal',
        name: 'MasterLinc Personal',
        url: 'https://masterlinc-personal--Fadil369.github.app',
        healthEndpoint: '/health',
        status: 'unknown',
        lastCheck: new Date(),
        metadata: {
          capabilities: ['personal', 'growth', 'wellbeing', 'productivity'],
        },
      },
      {
        id: 'basma-voice',
        name: 'Basma Voice Chat',
        url: 'https://basma-voice-chat-app--fadil369.github.app',
        healthEndpoint: '/health',
        status: 'unknown',
        lastCheck: new Date(),
        metadata: {
          capabilities: ['voice', 'chat', 'call-routing', 'ivr', 'stt', 'tts'],
        },
      },
      {
        id: 'brainsait-healthcare',
        name: 'BrainSAIT Healthcare',
        url: 'https://brainsait-healthcare--fadil369.github.app',
        healthEndpoint: '/health',
        status: 'unknown',
        lastCheck: new Date(),
        metadata: {
          capabilities: ['booking', 'triage', 'appointments', 'emr', 'patient-management'],
        },
      },
      {
        id: 'brainsait-oid',
        name: 'BrainSAIT OID Service',
        url: 'https://brainsait-oid-integr--fadil369.github.app',
        healthEndpoint: '/health',
        status: 'unknown',
        lastCheck: new Date(),
        metadata: {
          capabilities: ['oid-generation', 'identity', 'credentials', 'rbac', 'access-control'],
        },
      },
      {
        id: 'sbs-claims',
        name: 'SBS Claims Management',
        url: 'https://brainsait-sbs-dynamic.brainsait-fadil.workers.dev',
        healthEndpoint: '/health',
        status: 'unknown',
        lastCheck: new Date(),
        metadata: {
          capabilities: ['claims', 'nphies', 'billing', 'payments', 'pre-auth'],
        },
      },
    ];

    services.forEach((service) => {
      this.services.set(service.id, service);
      logger.info({ serviceId: service.id }, 'Registered service');
    });
  }

  /**
   * Register a new service
   */
  registerService(service: ServiceEndpoint): void {
    this.services.set(service.id, service);
    logger.info({ serviceId: service.id, serviceUrl: service.url }, 'Service registered');
  }

  /**
   * Get service by ID
   */
  getService(serviceId: string): ServiceEndpoint | undefined {
    return this.services.get(serviceId);
  }

  /**
   * Get all services
   */
  getAllServices(): ServiceEndpoint[] {
    return Array.from(this.services.values());
  }

  /**
   * Get healthy services only
   */
  getHealthyServices(): ServiceEndpoint[] {
    return this.getAllServices().filter((s) => s.status === 'healthy');
  }

  /**
   * Get services by capability
   */
  getServicesByCapability(capability: string): ServiceEndpoint[] {
    return this.getAllServices().filter((s) =>
      s.metadata.capabilities?.includes(capability),
    );
  }

  /**
   * Check health of a single service
   */
  async checkServiceHealth(serviceId: string): Promise<boolean> {
    const service = this.services.get(serviceId);
    if (!service) {
      logger.warn({ serviceId }, 'Service not found in registry');
      return false;
    }

    try {
      const response = await axios.get(`${service.url}${service.healthEndpoint}`, {
        timeout: 5000,
        validateStatus: (status) => status === 200,
      });

      service.status = 'healthy';
      service.lastCheck = new Date();
      
      if (response.data.version) {
        service.metadata.version = response.data.version;
      }

      logger.debug({ serviceId, status: 'healthy' }, 'Service health check passed');
      return true;
    } catch (error: any) {
      service.status = 'unhealthy';
      service.lastCheck = new Date();
      logger.warn({ serviceId, error: error.message }, 'Service health check failed');
      return false;
    }
  }

  /**
   * Check health of all services
   */
  async checkAllServicesHealth(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    const checks = Array.from(this.services.keys()).map(async (serviceId) => {
      const isHealthy = await this.checkServiceHealth(serviceId);
      results.set(serviceId, isHealthy);
    });

    await Promise.all(checks);
    return results;
  }

  /**
   * Start periodic health checks
   */
  startHealthMonitoring(intervalMs: number = 30000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      logger.info('Running periodic health checks');
      await this.checkAllServicesHealth();
    }, intervalMs);

    logger.info({ intervalMs }, 'Health monitoring started');
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info('Health monitoring stopped');
    }
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    const services = this.getAllServices();
    return {
      total: services.length,
      healthy: services.filter((s) => s.status === 'healthy').length,
      unhealthy: services.filter((s) => s.status === 'unhealthy').length,
      unknown: services.filter((s) => s.status === 'unknown').length,
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        lastCheck: s.lastCheck,
      })),
    };
  }
}
