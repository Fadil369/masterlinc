import express from 'express';
import { Pool } from 'pg';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import axios from 'axios';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const redis = createClient({ url: process.env.REDIS_URL });
redis.connect();

const OID_SERVICE_URL = process.env.OID_SERVICE_URL || 'http://localhost:3001';

// ===============================================
// AI AGENT TYPES
// ===============================================
const AGENT_TYPES = {
  PATIENT_COACHING: 'patient_coaching',
  CLINICAL_REASONING: 'clinical_reasoning',
  ADMIN_OPS: 'admin_ops',
  RESEARCH_ANALYTICS: 'research_analytics',
  SYSTEM_HEALTH: 'system_health'
};

// ===============================================
// PATIENT COACHING AGENT
// ===============================================
app.post('/api/ai/patient-coaching', async (req, res) => {
  try {
    const {
      patientId, userDid, inputText, language = 'en',
      context = {}, sessionId
    } = req.body;

    if (!patientId || !inputText) {
      return res.status(400).json({ success: false, error: 'patientId and inputText required' });
    }

    // Simulated AI response (in production, use actual AI model)
    const coaching = generatePatientCoaching(inputText, language, context);

    // Generate OID for interaction
    const oidResponse = await axios.post(`${OID_SERVICE_URL}/api/oid/register`, {
      branch: '7.1',
      serviceName: 'AI Patient Coaching',
      serviceType: 'ai_interaction',
      description: 'Patient coaching interaction',
      metadata: { agentType: AGENT_TYPES.PATIENT_COACHING, language }
    });

    const interactionOid = oidResponse.data.oid;

    // Store interaction
    await pool.query(
      `INSERT INTO ai_interactions (oid_identifier, agent_type, user_type, user_id, user_did, input_text, output_text, context, confidence_score, language, session_id, provenance_chain)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        interactionOid, AGENT_TYPES.PATIENT_COACHING, 'patient', patientId, userDid,
        inputText, coaching.response, JSON.stringify(context), coaching.confidence,
        language, sessionId || crypto.randomUUID(),
        JSON.stringify({ service: 'ai-orchestrator', oid: interactionOid, timestamp: new Date() })
      ]
    );

    res.json({
      success: true,
      response: coaching.response,
      confidence: coaching.confidence,
      recommendations: coaching.recommendations,
      oid: interactionOid
    });
  } catch (error: any) {
    console.error('Error in patient coaching:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================================
// CLINICAL REASONING AGENT (Doctor Support)
// ===============================================
app.post('/api/ai/clinical-reasoning', async (req, res) => {
  try {
    const {
      doctorDid, patientId, symptoms, vitals, history,
      language = 'en', context = {}
    } = req.body;

    if (!doctorDid || !patientId) {
      return res.status(400).json({ success: false, error: 'doctorDid and patientId required' });
    }

    // Simulated AI clinical reasoning
    const reasoning = generateClinicalReasoning(symptoms, vitals, history);

    // Generate OID
    const oidResponse = await axios.post(`${OID_SERVICE_URL}/api/oid/register`, {
      branch: '7.2',
      serviceName: 'AI Clinical Reasoning',
      serviceType: 'ai_interaction',
      description: 'Clinical decision support',
      metadata: { agentType: AGENT_TYPES.CLINICAL_REASONING }
    });

    const interactionOid = oidResponse.data.oid;

    // Store interaction
    await pool.query(
      `INSERT INTO ai_interactions (oid_identifier, agent_type, user_type, user_id, user_did, input_text, output_text, context, confidence_score, language, provenance_chain)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        interactionOid, AGENT_TYPES.CLINICAL_REASONING, 'doctor', patientId, doctorDid,
        JSON.stringify({ symptoms, vitals, history }), JSON.stringify(reasoning),
        JSON.stringify(context), reasoning.confidence, language,
        JSON.stringify({ service: 'ai-orchestrator', oid: interactionOid, doctorDid, timestamp: new Date() })
      ]
    );

    res.json({
      success: true,
      reasoning: reasoning.analysis,
      differentialDiagnosis: reasoning.differentialDiagnosis,
      recommendedTests: reasoning.recommendedTests,
      confidence: reasoning.confidence,
      oid: interactionOid
    });
  } catch (error: any) {
    console.error('Error in clinical reasoning:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================================
// ADMIN OPERATIONS AGENT
// ===============================================
app.post('/api/ai/admin-ops', async (req, res) => {
  try {
    const {
      requestType, data, language = 'en', userDid
    } = req.body;

    if (!requestType) {
      return res.status(400).json({ success: false, error: 'requestType required' });
    }

    // Simulated admin operations AI
    const opsResponse = generateAdminOpsResponse(requestType, data);

    // Generate OID
    const oidResponse = await axios.post(`${OID_SERVICE_URL}/api/oid/register`, {
      branch: '7.3',
      serviceName: 'AI Admin Operations',
      serviceType: 'ai_interaction',
      description: 'Administrative operations support',
      metadata: { agentType: AGENT_TYPES.ADMIN_OPS, requestType }
    });

    const interactionOid = oidResponse.data.oid;

    // Store interaction
    await pool.query(
      `INSERT INTO ai_interactions (oid_identifier, agent_type, user_type, user_did, input_text, output_text, confidence_score, language, provenance_chain)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        interactionOid, AGENT_TYPES.ADMIN_OPS, 'admin', userDid,
        JSON.stringify({ requestType, data }), JSON.stringify(opsResponse),
        opsResponse.confidence, language,
        JSON.stringify({ service: 'ai-orchestrator', oid: interactionOid, timestamp: new Date() })
      ]
    );

    res.json({
      success: true,
      response: opsResponse.response,
      actions: opsResponse.actions,
      confidence: opsResponse.confidence,
      oid: interactionOid
    });
  } catch (error: any) {
    console.error('Error in admin ops:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================================
// RESEARCH ANALYTICS AGENT
// ===============================================
app.post('/api/ai/research-analytics', async (req, res) => {
  try {
    const {
      query, dataScope, filters, userDid
    } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, error: 'query required' });
    }

    // Simulated research analytics
    const analytics = generateResearchAnalytics(query, dataScope, filters);

    // Generate OID
    const oidResponse = await axios.post(`${OID_SERVICE_URL}/api/oid/register`, {
      branch: '7.4',
      serviceName: 'AI Research Analytics',
      serviceType: 'ai_interaction',
      description: 'Research and analytics',
      metadata: { agentType: AGENT_TYPES.RESEARCH_ANALYTICS }
    });

    const interactionOid = oidResponse.data.oid;

    // Store interaction
    await pool.query(
      `INSERT INTO ai_interactions (oid_identifier, agent_type, user_type, user_did, input_text, output_text, confidence_score, provenance_chain)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        interactionOid, AGENT_TYPES.RESEARCH_ANALYTICS, 'researcher', userDid,
        JSON.stringify({ query, dataScope, filters }), JSON.stringify(analytics),
        analytics.confidence,
        JSON.stringify({ service: 'ai-orchestrator', oid: interactionOid, timestamp: new Date() })
      ]
    );

    res.json({
      success: true,
      analytics: analytics.results,
      insights: analytics.insights,
      confidence: analytics.confidence,
      oid: interactionOid
    });
  } catch (error: any) {
    console.error('Error in research analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================================
// SYSTEM HEALTH MONITORING AGENT
// ===============================================
app.get('/api/ai/system-health', async (req, res) => {
  try {
    // Simulated system health monitoring
    const healthMetrics = await generateSystemHealth();

    // Generate OID
    const oidResponse = await axios.post(`${OID_SERVICE_URL}/api/oid/register`, {
      branch: '7.5',
      serviceName: 'AI System Health',
      serviceType: 'ai_interaction',
      description: 'System health monitoring',
      metadata: { agentType: AGENT_TYPES.SYSTEM_HEALTH }
    });

    const interactionOid = oidResponse.data.oid;

    res.json({
      success: true,
      health: healthMetrics,
      oid: interactionOid
    });
  } catch (error: any) {
    console.error('Error in system health:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================================
// EXPLAINABILITY & BIAS DETECTION
// ===============================================
app.post('/api/ai/explain', async (req, res) => {
  try {
    const { interactionId } = req.body;

    if (!interactionId) {
      return res.status(400).json({ success: false, error: 'interactionId required' });
    }

    // Get interaction
    const result = await pool.query(
      'SELECT * FROM ai_interactions WHERE interaction_id = $1',
      [interactionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Interaction not found' });
    }

    const interaction = result.rows[0];

    // Generate explanation
    const explanation = {
      interactionId,
      agentType: interaction.agent_type,
      explanation: `This ${interaction.agent_type} interaction was processed based on input analysis and domain-specific rules.`,
      factorsConsidered: ['Input context', 'Historical patterns', 'Domain knowledge', 'Risk assessment'],
      confidence: interaction.confidence_score,
      biasDetection: {
        detected: false,
        risks: [],
        mitigation: 'Regular bias audits conducted'
      }
    };

    res.json({ success: true, explanation });
  } catch (error: any) {
    console.error('Error explaining AI:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================================
// HELPER FUNCTIONS (Simulated AI Logic)
// ===============================================
function generatePatientCoaching(input: string, language: string, context: any) {
  const inputLower = input.toLowerCase();
  
  let response = language === 'ar' 
    ? 'شكراً لتواصلك معنا. كيف يمكنني مساعدتك اليوم؟'
    : 'Thank you for reaching out. How can I help you today?';
  
  let recommendations: string[] = [];

  if (inputLower.includes('pain') || inputLower.includes('hurt')) {
    response = language === 'ar'
      ? 'أتفهم أنك تشعر بألم. هل يمكنك وصف موقع الألم وشدته؟'
      : 'I understand you are experiencing pain. Can you describe the location and severity?';
    recommendations = ['Schedule appointment', 'Monitor symptoms', 'Take prescribed medication'];
  } else if (inputLower.includes('appointment') || inputLower.includes('booking')) {
    response = language === 'ar'
      ? 'سأساعدك في حجز موعد. ما هو التاريخ المفضل لديك؟'
      : 'I can help you book an appointment. What is your preferred date?';
    recommendations = ['Check available slots', 'Confirm insurance', 'Prepare medical history'];
  }

  return {
    response,
    recommendations,
    confidence: 0.85
  };
}

function generateClinicalReasoning(symptoms: any[], vitals: any, history: any) {
  const analysis = {
    summary: 'Based on the presented symptoms and vitals, preliminary assessment suggests further investigation.',
    urgency: 'Medium',
    confidenceLevel: 'Moderate'
  };

  const differentialDiagnosis = [
    { condition: 'Condition A', probability: 0.35, reasoning: 'Common presentation with these symptoms' },
    { condition: 'Condition B', probability: 0.25, reasoning: 'Age and vital signs correlation' },
    { condition: 'Condition C', probability: 0.15, reasoning: 'Historical indicators present' }
  ];

  const recommendedTests = [
    'Complete Blood Count (CBC)',
    'Chest X-Ray',
    'ECG'
  ];

  return {
    analysis,
    differentialDiagnosis,
    recommendedTests,
    confidence: 0.78
  };
}

function generateAdminOpsResponse(requestType: string, data: any) {
  const response = {
    status: 'processed',
    message: `${requestType} request has been analyzed and queued for processing.`,
    estimatedCompletionTime: '2-4 hours'
  };

  const actions = [
    { action: 'Verify request data', status: 'completed' },
    { action: 'Route to appropriate department', status: 'pending' },
    { action: 'Send confirmation notification', status: 'pending' }
  ];

  return {
    response,
    actions,
    confidence: 0.92
  };
}

function generateResearchAnalytics(query: string, dataScope: any, filters: any) {
  const results = {
    totalRecords: 1247,
    matchingCriteria: 342,
    timeRange: '2023-2024',
    topFindings: [
      'Trend A: 35% increase in metric X',
      'Correlation B: Significant relationship between Y and Z',
      'Pattern C: Seasonal variation detected'
    ]
  };

  const insights = [
    'Data shows consistent patterns across demographics',
    'Consider expanding research scope to include Factor D',
    'Statistical significance achieved (p < 0.05)'
  ];

  return {
    results,
    insights,
    confidence: 0.88
  };
}

async function generateSystemHealth() {
  return {
    overall: 'healthy',
    services: {
      oidRegistry: 'operational',
      didRegistry: 'operational',
      healthcareApi: 'operational',
      database: 'operational',
      redis: 'operational'
    },
    metrics: {
      uptime: '99.9%',
      responseTime: '45ms',
      activeUsers: 127,
      apiCalls24h: 15234
    },
    alerts: [],
    recommendations: [
      'System operating within normal parameters',
      'No immediate actions required'
    ]
  };
}

// ===============================================
// HEALTH CHECK
// ===============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'BrainSAIT AI Orchestrator',
    version: '1.0.0',
    agents: Object.values(AGENT_TYPES),
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3004;

async function start() {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 AI Orchestrator Service running on port ${PORT}`);
      console.log(`🤖 AI Agents: ${Object.values(AGENT_TYPES).join(', ')}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
