import express from 'express';
import { radiologyAnalyzer } from '@masterlinc/deepseek-radiology';
import { radioLincAgent } from '@masterlinc/radiolinc-agent';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

/**
 * MasterLinc Coordinator - Routes commands from Clawdbot to appropriate services
 */

app.post('/api/process', async (req, res) => {
  try {
    const { source, platform, user, command, rawMessage } = req.body;

    console.log(`[MasterLinc] Processing command from ${source}:`, command);

    // Route to appropriate handler
    const response = await routeCommand(command, { source, platform, user });

    res.json({
      success: true,
      message: response,
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error('[MasterLinc] Error:', error);
    res.status(500).json({
      success: false,
      message: `Error: ${error?.message || error}`,
      timestamp: Date.now()
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'masterlinc-coordinator',
    version: '1.0.0',
    uptime: process.uptime(),
    components: {
      deepseek: 'ready',
      radiolinc: 'ready',
      orthanc: process.env.ORTHANC_URL || 'http://localhost:8042'
    }
  });
});

/**
 * RadioLinc triage endpoint
 */
app.post('/api/radiolinc/triage', async (req, res) => {
  try {
    const { studyId } = req.body;
    
    if (!studyId) {
      return res.status(400).json({ error: 'studyId required' });
    }

    console.log(`[MasterLinc] RadioLinc triage request for study: ${studyId}`);
    const result = await radioLincAgent.triageNewStudy(studyId);

    res.json({
      success: true,
      studyId,
      classification: result.classification,
      priority: result.priority,
      findings: result.findings,
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error('[MasterLinc] RadioLinc triage error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || error,
      timestamp: Date.now()
    });
  }
});

/**
 * Command router
 */
async function routeCommand(command: string, context: any): Promise<string> {
  const cmd = command.toLowerCase().trim();

  // Health/status commands
  if (cmd === 'health' || cmd === 'ping') {
    return '✅ MasterLinc Coordinator is running';
  }

  // AI Analysis commands
  if (cmd.startsWith('analyze study') || cmd.startsWith('analyze ')) {
    const studyIdMatch = command.match(/analyze\s+(?:study\s+)?([a-f0-9-]+)/i);
    if (!studyIdMatch) {
      return '❌ Please provide a study ID. Usage: analyze study <ID>';
    }

    const studyId = studyIdMatch[1];
    return await analyzeStudyCommand(studyId);
  }

  // Report generation
  if (cmd.startsWith('generate report') || cmd.startsWith('report')) {
    const studyIdMatch = command.match(/(?:generate report|report)\s+(?:for\s+)?(?:study\s+)?([a-f0-9-]+)/i);
    if (!studyIdMatch) {
      return '❌ Please provide a study ID. Usage: report <ID>';
    }

    const studyId = studyIdMatch[1];
    return await generateReportCommand(studyId);
  }

  // Natural language query
  if (cmd.startsWith('query') || cmd.startsWith('find') || cmd.startsWith('search')) {
    const query = command.replace(/^(query|find|search)\s+/i, '');
    return await naturalLanguageQueryCommand(query);
  }

  // Default: return help
  return getHelp();
}

/**
 * AI-powered study analysis
 */
async function analyzeStudyCommand(studyId: string): Promise<string> {
  try {
    console.log('[MasterLinc] Analyzing study:', studyId);

    const analysis = await radiologyAnalyzer.analyzeStudy(studyId);

    let response = `🧠 *AI Study Analysis*\n\n`;
    response += `📊 Study ID: \`${studyId.substring(0, 8)}\`\n`;
    response += `⚡ Classification: *${analysis.classification.toUpperCase()}*\n`;
    response += `📈 Priority: ${analysis.priority}/10\n\n`;

    if (analysis.findings.length > 0) {
      response += `🔍 *Key Areas to Evaluate*:\n`;
      analysis.findings.forEach(f => response += `• ${f}\n`);
      response += `\n`;
    }

    if (analysis.qualityChecks.length > 0) {
      response += `✅ *Quality Checks*:\n`;
      analysis.qualityChecks.forEach(q => response += `• ${q}\n`);
      response += `\n`;
    }

    if (analysis.recommendations.length > 0) {
      response += `💡 *Recommendations*:\n`;
      analysis.recommendations.forEach(r => response += `• ${r}\n`);
      response += `\n`;
    }

    response += `📝 *AI Reasoning*:\n${analysis.reasoning}\n\n`;
    response += `_Analysis powered by DeepSeek V3.2_`;

    return response;

  } catch (error: any) {
    return `❌ Analysis failed: ${error?.message || error}`;
  }
}

/**
 * Generate radiology report template
 */
async function generateReportCommand(studyId: string): Promise<string> {
  try {
    console.log('[MasterLinc] Generating report for:', studyId);

    const report = await radiologyAnalyzer.generateReport(studyId);

    let response = `📄 *AI-Generated Report Template*\n\n`;
    response += `Study ID: \`${studyId.substring(0, 8)}\`\n\n`;
    response += `${report}\n\n`;
    response += `_Template generated by DeepSeek V3.2_\n`;
    response += `_Please review and modify as needed_`;

    return response;

  } catch (error: any) {
    return `❌ Report generation failed: ${error?.message || error}`;
  }
}

/**
 * Natural language query processing
 */
async function naturalLanguageQueryCommand(query: string): Promise<string> {
  try {
    console.log('[MasterLinc] Processing NL query:', query);

    const result = await radiologyAnalyzer.naturalLanguageQuery(query);

    return `🤖 *Query Analysis*\n\n${result}\n\n_Powered by DeepSeek AI_`;

  } catch (error: any) {
    return `❌ Query failed: ${error?.message || error}`;
  }
}

/**
 * Help message
 */
function getHelp(): string {
  return `🎯 *MasterLinc AI Commands*\n\n` +
    `🧠 \`analyze study <ID>\` - AI analysis of DICOM study\n` +
    `📄 \`report <ID>\` - Generate report template\n` +
    `🔍 \`query <question>\` - Natural language search\n` +
    `✅ \`health\` - System status\n\n` +
    `_Advanced AI powered by DeepSeek V3.2_`;
}

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 MasterLinc Coordinator listening on port ${PORT}`);
  console.log(`📡 Ready to receive commands from Clawdbot`);
});

export default app;
