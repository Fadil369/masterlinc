/**
 * Live Service Connector
 * Utilities to connect and verify live service endpoints
 */

import axios from 'axios';
import { pino } from 'pino';

const logger = pino({ name: 'live-connector' });

export interface ServiceConnection {
  serviceId: string;
  url: string;
  status: 'connected' | 'failed';
  responseTime?: number;
  version?: string;
  error?: string;
}

export class LiveServiceConnector {
  /**
   * Test connection to live service
   */
  static async testConnection(url: string, serviceId: string): Promise<ServiceConnection> {
    logger.info({ url, serviceId }, 'Testing connection to live service');
    
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${url}/health`, {
        timeout: 10000,
        validateStatus: (status) => status === 200 || status === 404,
      });

      const responseTime = Date.now() - startTime;

      if (response.status === 404) {
        // Service is up but no health endpoint
        logger.info({ serviceId, url }, 'Service reachable but no health endpoint');
        return {
          serviceId,
          url,
          status: 'connected',
          responseTime,
          version: 'unknown',
        };
      }

      logger.info({ serviceId, responseTime }, 'Successfully connected to live service');
      
      return {
        serviceId,
        url,
        status: 'connected',
        responseTime,
        version: response.data.version || 'unknown',
      };
    } catch (error: any) {
      logger.error({ error: error.message, serviceId }, 'Failed to connect to live service');
      
      return {
        serviceId,
        url,
        status: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Test all registered services
   */
  static async testAllServices(): Promise<ServiceConnection[]> {
    const services = [
      {
        id: 'basma-voice',
        url: 'https://basma-voice-chat-app--fadil369.github.app',
      },
      {
        id: 'brainsait-healthcare',
        url: 'https://brainsait-healthcare--fadil369.github.app',
      },
      {
        id: 'brainsait-oid',
        url: 'https://brainsait-oid-integr--fadil369.github.app',
      },
      {
        id: 'sbs-claims',
        url: 'https://sbs--fadil369.github.app',
      },
    ];

    logger.info('Testing connections to all live services');

    const results = await Promise.all(
      services.map((service) => this.testConnection(service.url, service.id)),
    );

    const connected = results.filter((r) => r.status === 'connected').length;
    logger.info({ total: results.length, connected }, 'Service connection test complete');

    return results;
  }

  /**
   * Create API client for live service
   */
  static createClient(baseUrl: string) {
    return axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MasterLinc-Orchestrator/2.0',
      },
    });
  }
}
