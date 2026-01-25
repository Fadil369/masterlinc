
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', mode: 'mock-orchestrator' });
});

// AI Conversation (Claude Mock)
app.post('/api/ai/conversation', (req, res) => {
  const { message } = req.body;
  console.log('Received AI message:', message);
  
  setTimeout(() => {
    res.json({
      role: 'assistant',
      content: `I received your message: "${message}". I am the MasterLinc Brain (Mock) and I am processing your healthcare request via the Intelligent Core.`,
      actions: []
    });
  }, 500);
});

// Services
app.get('/api/services', (req, res) => {
  res.json({
    services: [
      { id: 'basma', name: 'Basma Voice', status: 'online' },
      { id: 'healthcare', name: 'Healthcare Portal', status: 'online' },
      { id: 'sbs', name: 'SBS Claims', status: 'online' }
    ]
  });
});

// Workflows
app.post('/api/workflows/start', (req, res) => {
  res.json({ workflowId: 'wf-mock-123', status: 'started' });
});

app.listen(PORT, () => {
  console.log(`Mock Orchestrator running on http://localhost:${PORT}`);
});
