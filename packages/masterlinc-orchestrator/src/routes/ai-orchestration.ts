/**
 * AI ORCHESTRATION API ROUTES
 * Endpoints for AI-powered services across all stakeholders
 */

import { Router, Request, Response } from 'express';
import { aiOrchestrator } from '../services/ai-orchestration';
import type { AIOrchestrationRequest } from '../../../shared/healthcare-types';

const router = Router();

/**
 * POST /api/ai/orchestrate
 * Main AI orchestration endpoint
 */
router.post('/ai/orchestrate', async (req: Request, res: Response) => {
  try {
    const request: AIOrchestrationRequest = req.body;

    if (!request.service_type || !request.context) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: service_type, context',
      });
    }

    const result = await aiOrchestrator.orchestrate(request);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in AI orchestration:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'AI orchestration failed',
    });
  }
});

/**
 * POST /api/ai/patient/triage
 * Patient triage AI service
 */
router.post('/ai/patient/triage', async (req: Request, res: Response) => {
  try {
    const { patient_oid, chief_complaint, symptoms, pain_level, transcript, language = 'ar' } = req.body;

    const request: AIOrchestrationRequest = {
      service_type: 'patient_triage',
      context: { patient_oid, language },
      parameters: { chief_complaint, symptoms, pain_level, transcript },
    };

    const result = await aiOrchestrator.orchestrate(request);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in patient triage:', error);
    res.status(500).json({
      success: false,
      error: 'Patient triage failed',
    });
  }
});

/**
 * POST /api/ai/patient/insights
 * Generate patient insights
 */
router.post('/ai/patient/insights', async (req: Request, res: Response) => {
  try {
    const { patient_oid, patient_history, recent_visits, lab_results, language = 'en' } = req.body;

    const request: AIOrchestrationRequest = {
      service_type: 'patient_insights',
      context: { patient_oid, language },
      parameters: { patient_history, recent_visits, lab_results },
    };

    const result = await aiOrchestrator.orchestrate(request);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generating patient insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate patient insights',
    });
  }
});

/**
 * POST /api/ai/patient/engagement
 * Patient engagement AI (reminders, education)
 */
router.post('/ai/patient/engagement', async (req: Request, res: Response) => {
  try {
    const { patient_oid, engagement_type, patient_data, language = 'ar' } = req.body;

    const request: AIOrchestrationRequest = {
      service_type: 'patient_engagement',
      context: { patient_oid, language },
      parameters: { engagement_type, patient_data },
    };

    const result = await aiOrchestrator.orchestrate(request);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in patient engagement:', error);
    res.status(500).json({
      success: false,
      error: 'Patient engagement failed',
    });
  }
});

/**
 * POST /api/ai/doctor/decision-support
 * Clinical decision support
 */
router.post('/ai/doctor/decision-support', async (req: Request, res: Response) => {
  try {
    const {
      doctor_oid,
      patient_oid,
      patient_data,
      chief_complaint,
      exam_findings,
      vitals,
      language = 'en',
    } = req.body;

    const request: AIOrchestrationRequest = {
      service_type: 'doctor_decision_support',
      context: { doctor_oid, patient_oid, language },
      parameters: { patient_data, chief_complaint, exam_findings, vitals },
    };

    const result = await aiOrchestrator.orchestrate(request);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in decision support:', error);
    res.status(500).json({
      success: false,
      error: 'Decision support failed',
    });
  }
});

/**
 * POST /api/ai/doctor/documentation
 * AI-assisted documentation
 */
router.post('/ai/doctor/documentation', async (req: Request, res: Response) => {
  try {
    const {
      doctor_oid,
      patient_oid,
      document_type,
      voice_transcript,
      template,
      patient_data,
      language = 'en',
    } = req.body;

    const request: AIOrchestrationRequest = {
      service_type: 'doctor_documentation',
      context: { doctor_oid, patient_oid, language },
      parameters: { document_type, voice_transcript, template, patient_data },
    };

    const result = await aiOrchestrator.orchestrate(request);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in documentation:', error);
    res.status(500).json({
      success: false,
      error: 'Documentation generation failed',
    });
  }
});

/**
 * POST /api/ai/admin/scheduling
 * AI-powered scheduling optimization
 */
router.post('/ai/admin/scheduling', async (req: Request, res: Response) => {
  try {
    const { doctor_availability, patient_requests, constraints } = req.body;

    const request: AIOrchestrationRequest = {
      service_type: 'admin_scheduling',
      context: {},
      parameters: { doctor_availability, patient_requests, constraints },
    };

    const result = await aiOrchestrator.orchestrate(request);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in scheduling:', error);
    res.status(500).json({
      success: false,
      error: 'Scheduling optimization failed',
    });
  }
});

/**
 * POST /api/ai/admin/resource-optimization
 * Resource optimization
 */
router.post('/ai/admin/resource-optimization', async (req: Request, res: Response) => {
  try {
    const { current_utilization, forecasted_demand } = req.body;

    const request: AIOrchestrationRequest = {
      service_type: 'admin_resource_optimization',
      context: {},
      parameters: { current_utilization, forecasted_demand },
    };

    const result = await aiOrchestrator.orchestrate(request);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in resource optimization:', error);
    res.status(500).json({
      success: false,
      error: 'Resource optimization failed',
    });
  }
});

/**
 * POST /api/ai/analytics
 * AI-powered analytics and insights
 */
router.post('/ai/analytics', async (req: Request, res: Response) => {
  try {
    const { metric_type, time_range, data } = req.body;

    const request: AIOrchestrationRequest = {
      service_type: 'analytics',
      context: {},
      parameters: { metric_type, time_range, data },
    };

    const result = await aiOrchestrator.orchestrate(request);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Analytics generation failed',
    });
  }
});

export default router;
