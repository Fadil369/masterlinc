#!/usr/bin/env node
/**
 * MasterLinc Orchestrator - Main Entry Point
 * Central coordinator for BrainSAIT healthcare ecosystem
 */

import express, { type Request, type Response } from 'express';
import { pino } from 'pino';
import { loadConfig } from './config/config.js';
import { ServiceRegistry } from './services/service-registry.js';
import { BasmaIntegration } from './services/basma-integration.js';
import { HealthcareIntegration } from './services/healthcare-integration.js';
import { OIDIntegration } from './services/oid-integration.js';
import { SBSIntegration } from './services/sbs-integration.js';
import { DatabaseManager } from './data/database.js';
import { WorkflowEngine } from './workflows/workflow-engine.js';
import { RealtimeServer } from './features/websocket-server.js';
import { EventBus } from './features/event-bus.js';
import { AnalyticsEngine } from './features/analytics.js';

const logger = pino({ 
  name: 'masterlinc-orchestrator',
  level: process.env.LOG_LEVEL || 'info',
});

class MasterLincOrchestrator {
  private app: express.Application;
  private config = loadConfig();
  private registry: ServiceRegistry;
  private db: DatabaseManager;
  private basma: BasmaIntegration;
  private healthcare: HealthcareIntegration;
  private oid: OIDIntegration;
  private sbs: SBSIntegration;
  private workflow: WorkflowEngine;
  private websocket: RealtimeServer | null = null;
  private eventBus: EventBus;
  private analytics: AnalyticsEngine;

  constructor() {
    this.app = express();
    this.registry = new ServiceRegistry();
    this.db = new DatabaseManager();
    this.basma = new BasmaIntegration(this.registry);
    this.healthcare = new HealthcareIntegration(this.registry);
    this.oid = new OIDIntegration(this.registry);
    this.sbs = new SBSIntegration(this.registry);
    this.workflow = new WorkflowEngine(
      this.basma,
      this.healthcare,
      this.oid,
      this.sbs,
      this.db,
    );
    this.eventBus = new EventBus(process.env.RABBITMQ_URL || 'amqp://localhost');
    this.analytics = new AnalyticsEngine(this.db);
  }

  /**
   * Initialize the orchestrator
   */
  async initialize(): Promise<void> {
    logger.info('Initializing MasterLinc Orchestrator');

    try {
      // Initialize database
      await this.db.initialize();
      logger.info('Database initialized');

      // Initialize event bus
      await this.eventBus.initialize();
      logger.info('Event bus initialized');

      // Check all services health
      await this.registry.checkAllServicesHealth();
      
      // Start health monitoring
      this.registry.startHealthMonitoring(
        parseInt(this.config.HEALTH_CHECK_INTERVAL),
      );
      logger.info('Service health monitoring started');

      // Setup middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      logger.info('MasterLinc Orchestrator initialized successfully');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to initialize orchestrator');
      throw error;
    }
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });

    // Request logging
    this.app.use((req, res, next) => {
      logger.info({ method: req.method, path: req.path }, 'Incoming request');
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', async (req: Request, res: Response) => {
      const dbHealth = await this.db.healthCheck();
      const serviceHealth = this.registry.getStatistics();

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: dbHealth,
        services: serviceHealth,
      });
    });

    // Service registry endpoints
    this.app.get('/api/services', (req: Request, res: Response) => {
      res.json({
        services: this.registry.getAllServices(),
      });
    });

    this.app.get('/api/services/:serviceId', (req: Request, res: Response) => {
      const service = this.registry.getService(req.params.serviceId);
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      res.json(service);
    });

    // Workflow endpoints
    this.app.post('/api/workflows/start-from-call', async (req: Request, res: Response) => {
      try {
        const { callId, from } = req.body;
        const workflow = await this.workflow.startWorkflowFromCall(callId, from);
        res.json(workflow);
      } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to start workflow');
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/workflows/:workflowId/complete-service', async (req: Request, res: Response) => {
      try {
        const { workflowId } = req.params;
        const { services } = req.body;
        await this.workflow.completeServicePhase(workflowId, services);
        res.json({ success: true });
      } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to complete service');
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/workflows/:workflowId', async (req: Request, res: Response) => {
      try {
        const workflow = await this.workflow.getWorkflow(req.params.workflowId);
        if (!workflow) {
          return res.status(404).json({ error: 'Workflow not found' });
        }
        res.json(workflow);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/workflows/patient/:patientId', async (req: Request, res: Response) => {
      try {
        const workflows = await this.workflow.getPatientWorkflows(req.params.patientId);
        res.json({ workflows });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Patient endpoints
    this.app.get('/api/patients/phone/:phone', async (req: Request, res: Response) => {
      try {
        const patient = await this.healthcare.getPatientByPhone(req.params.phone);
        if (!patient) {
          return res.status(404).json({ error: 'Patient not found' });
        }
        res.json(patient);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/patients', async (req: Request, res: Response) => {
      try {
        const patient = await this.healthcare.upsertPatient(req.body);
        res.json(patient);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Basma integration endpoints
    this.app.post('/api/calls/make', async (req: Request, res: Response) => {
      try {
        const call = await this.basma.makeCall(req.body);
        res.json(call);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/sms/send', async (req: Request, res: Response) => {
      try {
        const success = await this.basma.sendSMS(req.body);
        res.json({ success });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // OID endpoints
    this.app.post('/api/oid/generate', async (req: Request, res: Response) => {
      try {
        const oid = await this.oid.generateOID(req.body);
        res.json(oid);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/credentials/issue', async (req: Request, res: Response) => {
      try {
        const credential = await this.oid.issueCredential(req.body);
        res.json(credential);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // SBS/Claims endpoints
    this.app.post('/api/claims/create', async (req: Request, res: Response) => {
      try {
        const claim = await this.sbs.createClaim(req.body);
        res.json(claim);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/claims/:claimId/submit-nphies', async (req: Request, res: Response) => {
      try {
        const result = await this.sbs.submitClaimToNPHIES(req.params.claimId);
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Statistics endpoint
    this.app.get('/api/statistics', async (req: Request, res: Response) => {
      try {
        const stats = {
          services: this.registry.getStatistics(),
          workflows: await this.workflow.getStatistics(),
          websocket: {
            connectedClients: this.websocket?.getConnectedClientsCount() || 0,
          },
        };
        res.json(stats);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Analytics endpoints
    this.app.get('/api/analytics/report', async (req: Request, res: Response) => {
      try {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
        
        const report = await this.analytics.generateReport(startDate, endDate);
        res.json(report);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/analytics/dashboard', async (req: Request, res: Response) => {
      try {
        const metrics = await this.analytics.getDashboardMetrics();
        res.json(metrics);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Catch-all 404
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: 'Not found' });
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    const port = parseInt(this.config.PORT);

    const server = this.app.listen(port, '0.0.0.0', () => {
      logger.info({ port }, 'MasterLinc Orchestrator running');
      logger.info(`Health: http://localhost:${port}/health`);
      logger.info(`API: http://localhost:${port}/api/*`);
      logger.info(`WebSocket: ws://localhost:${port}/ws`);
    });

    // Initialize WebSocket server
    this.websocket = new RealtimeServer(server);
    logger.info('WebSocket server initialized');
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down gracefully');
    
    this.registry.stopHealthMonitoring();
    await this.db.close();
    
    logger.info('Shutdown complete');
    process.exit(0);
  }
}

// Main execution
async function main() {
  const orchestrator = new MasterLincOrchestrator();

  try {
    await orchestrator.initialize();
    await orchestrator.start();

    // Handle shutdown signals
    process.on('SIGINT', () => orchestrator.shutdown());
    process.on('SIGTERM', () => orchestrator.shutdown());
  } catch (error: any) {
    logger.fatal({ error: error.message }, 'Fatal error');
    process.exit(1);
  }
}

main();
