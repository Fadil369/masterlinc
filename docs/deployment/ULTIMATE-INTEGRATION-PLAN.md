# 🌟 ULTIMATE BRAINSAIT INTEGRATION ARCHITECTURE

## The Complete Medical Communication & Imaging Platform

**Combining:** Clawdbot + MasterLinc + DeepSeek + 3CX + Twilio + RadioLinc + Basma + Orthanc + OHIF

---

## 🎯 Vision

Create the **world's first fully AI-orchestrated medical imaging platform** where:
- Patients call/text/chat to get their imaging results
- AI agents handle triage, routing, and preliminary analysis  
- Doctors access studies via voice commands or messaging
- Everything is HIPAA-compliant and traceable

---

## 🏗️ Complete Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PATIENT/PROVIDER ENTRY POINTS                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📱 WhatsApp    📲 Telegram    ☎️ Phone (3CX)    🎙️ Voice (Basma)      │
│      │              │              │                  │                 │
│      └──────────────┴──────────────┴──────────────────┘                 │
│                            │                                            │
├────────────────────────────┼────────────────────────────────────────────┤
│               MESSAGING & ORCHESTRATION LAYER                           │
├────────────────────────────┼────────────────────────────────────────────┤
│                            │                                            │
│                  ┌─────────▼──────────┐                                 │
│                  │   Clawdbot Agent   │                                 │
│                  │  (Chat Interface)  │                                 │
│                  └─────────┬──────────┘                                 │
│                            │                                            │
│                  ┌─────────▼──────────┐                                 │
│                  │ MasterLinc Coord   │                                 │
│                  │ (Central Router)   │                                 │
│                  └─────────┬──────────┘                                 │
│                            │                                            │
│         ┌──────────────────┼──────────────────┐                         │
│         │                  │                  │                         │
├─────────┼──────────────────┼──────────────────┼─────────────────────────┤
│    INTELLIGENT AGENT LAYER                                              │
├─────────┼──────────────────┼──────────────────┼─────────────────────────┤
│         │                  │                  │                         │
│  ┌──────▼───────┐  ┌───────▼───────┐  ┌──────▼────────┐                │
│  │  RadioLinc   │  │  DeepSeek AI  │  │   Basma AI    │                │
│  │   Agent      │  │   (Reasoning) │  │  (Voice STT/  │                │
│  │              │  │               │  │      TTS)     │                │
│  │ - Triage     │  │ - Analysis    │  │               │                │
│  │ - Route      │  │ - Reports     │  │ - Voice Cmds  │                │
│  │ - Coordinate │  │ - NL Queries  │  │ - Synthesis   │                │
│  └──────┬───────┘  └───────┬───────┘  └───────────────┘                │
│         │                  │                                            │
├─────────┼──────────────────┼────────────────────────────────────────────┤
│      BACKEND SERVICES                                                   │
├─────────┼──────────────────┼────────────────────────────────────────────┤
│         │                  │                                            │
│  ┌──────▼──────────────────▼────────┐      ┌──────────────────┐        │
│  │      Orthanc PACS System         │      │   3CX PBX        │        │
│  │    (DICOM Storage & API)         │      │  (Phone System)  │        │
│  └──────┬───────────────────────────┘      └────────┬─────────┘        │
│         │                                            │                  │
│  ┌──────▼───────────────────────────┐      ┌────────▼─────────┐        │
│  │     OHIF Viewer                  │      │  Twilio SIP      │        │
│  │  (Web DICOM Viewer)              │      │    Trunk         │        │
│  └──────────────────────────────────┘      └──────────────────┘        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎭 Use Case Workflows

### 1. **Patient Calls for Results** ☎️

```
1. Patient dials clinic number
   ↓
2. 3CX routes to RadioLinc agent
   ↓
3. Basma AI: "Hello! What's your patient ID?"
   ↓
4. Patient: "12345"
   ↓
5. RadioLinc queries Orthanc for patient studies
   ↓
6. DeepSeek AI analyzes latest study
   ↓
7. Basma AI (voice): "Your brain MRI from yesterday shows..."
   ↓
8. SMS sent with OHIF viewer link
   ↓
9. Call recorded & logged for compliance
```

### 2. **Doctor Checks Studies via WhatsApp** 📱

```
1. Doctor: "@bot studies for today"
   ↓
2. Clawdbot → MasterLinc Coordinator
   ↓
3. Queries Orthanc PACS
   ↓
4. Returns list with thumbnails
   ↓
5. Doctor: "@bot analyze study abc123"
   ↓
6. DeepSeek AI provides detailed analysis
   ↓
7. Doctor: "@bot call me about this"
   ↓
8. 3CX initiates outbound call
   ↓
9. Basma AI reads full report over phone
```

### 3. **Urgent Study Triage** 🚨

```
1. New DICOM study uploaded to Orthanc
   ↓
2. Webhook triggers MasterLinc
   ↓
3. DeepSeek AI analyzes:
   - Modality (CT Brain = high priority)
   - Time of day (3 AM = emergency)
   - Keywords (stroke, hemorrhage)
   ↓
4. Classified as EMERGENT
   ↓
5. RadioLinc agent:
   - Calls on-call radiologist (3CX)
   - Sends WhatsApp alert
   - Emails OHIF link
   ↓
6. Basma AI: "URGENT: Possible stroke, CT Brain, view now"
   ↓
7. All actions logged for audit
```

### 4. **Voice-Activated Reporting** 🎙️

```
1. Radiologist: (via phone) "Generate report for study xyz789"
   ↓
2. Basma AI (STT): Converts speech to text
   ↓
3. MasterLinc routes to DeepSeek AI
   ↓
4. AI fetches DICOM metadata from Orthanc
   ↓
5. Generates professional report template
   ↓
6. Basma AI (TTS): Reads report back
   ↓
7. Radiologist: "Looks good, save it"
   ↓
8. Report stored in Orthanc
   ↓
9. Patient notified via preferred channel
```

### 5. **Multi-Channel Follow-up** 📬

```
1. Study completed → AI analysis done
   ↓
2. RadioLinc checks patient preference:
   - Channel: WhatsApp preferred
   - Language: English
   - Time: 9 AM - 5 PM only
   ↓
3. Next morning at 10 AM:
   ↓
4. WhatsApp: "Hi John! Your MRI results are ready."
   ↓
5. Patient: "What did it show?"
   ↓
6. DeepSeek AI (simplified language):
   "Everything looks normal. No concerns."
   ↓
7. Patient: "Can I see the images?"
   ↓
8. OHIF viewer link sent
   ↓
9. Patient: "Thanks!"
   ↓
10. RadioLinc marks as "Patient notified - satisfied"
```

---

## 🛠️ Technical Implementation

### RadioLinc Agent Configuration

**File:** `~/masterlinc/packages/radiolinc-agent/src/index.ts`

```typescript
import { MasterLincBridge } from '@masterlinc/3cx-mcp';
import { radiologyAnalyzer } from '@masterlinc/deepseek-radiology';
import { BasmaVoiceAI } from '@masterlinc/basma';

export class RadioLincAgent {
  private masterlinc: MasterLincBridge;
  private ai: typeof radiologyAnalyzer;
  private voice: BasmaVoiceAI;
  
  async handleIncomingCall(call: IncomingCall) {
    // 1. Greet patient via Basma AI
    const greeting = await this.voice.synthesize(
      "Hello! This is BrainSAIT medical imaging. How can I help?"
    );
    await call.playAudio(greeting);
    
    // 2. Listen for patient ID
    const patientId = await this.voice.listen(call);
    
    // 3. Query Orthanc for studies
    const studies = await this.getPatientStudies(patientId);
    
    if (studies.length === 0) {
      return this.voice.speak("No studies found for that ID.");
    }
    
    // 4. Get AI analysis
    const latest = studies[0];
    const analysis = await this.ai.analyzeStudy(latest.id);
    
    // 5. Determine urgency
    if (analysis.classification === 'emergent') {
      return this.escalateToDoctor(call, analysis);
    }
    
    // 6. Provide results via voice
    const summary = this.simplifyForPatient(analysis);
    await this.voice.speak(summary);
    
    // 7. Send OHIF link via SMS
    await this.sendStudyLink(call.from, latest.id);
    
    // 8. Log interaction
    await this.logInteraction(call, analysis);
  }
  
  async handleWhatsAppMessage(msg: WhatsAppMessage) {
    // Route to appropriate handler
    if (msg.text.includes('study') || msg.text.includes('results')) {
      return this.handleStudyQuery(msg);
    }
    
    if (msg.text.includes('urgent') || msg.text.includes('emergency')) {
      return this.handleEmergency(msg);
    }
    
    // Default: AI conversation
    return this.chatWithPatient(msg);
  }
  
  async triageNewStudy(studyId: string) {
    const analysis = await this.ai.analyzeStudy(studyId);
    
    const actions = {
      emergent: () => this.alertOnCallDoctor(studyId, analysis),
      urgent: () => this.notifyRadiologist(studyId, analysis),
      routine: () => this.queueForReview(studyId)
    };
    
    return actions[analysis.classification]();
  }
  
  private async alertOnCallDoctor(studyId: string, analysis: any) {
    // 1. Get on-call schedule
    const doctor = await this.getOnCallDoctor();
    
    // 2. Call via 3CX
    const call = await this.masterlinc.makeCall(doctor.extension);
    
    // 3. Voice alert
    await this.voice.speak(
      `URGENT: ${analysis.findings.join('. ')} Study ID ${studyId}`
    );
    
    // 4. Multi-channel backup
    await this.sendWhatsApp(doctor.phone, `🚨 URGENT STUDY: ${studyId}`);
    await this.sendEmail(doctor.email, analysis);
    
    return { alerted: true, doctor: doctor.name };
  }
}
```

---

## 🔧 Integration Points

### 1. **3CX ↔ MasterLinc Bridge**

**Existing:** `~/masterlinc/packages/3cx-mcp/src/integrations/masterlinc-bridge.ts`

**Enhancement Needed:**
```typescript
// Add RadioLinc routing
async coordinateCall(call: ActiveCall): Promise<LincCoordinateResponse> {
  const request = {
    event: 'call.incoming',
    caller: call.Caller,
    callee: call.Callee,
    extension: call.Extension,
    direction: call.Direction
  };
  
  // NEW: Route to RadioLinc agent
  const response = await fetch(`${this.baseUrl}/api/v1/radiolinc/coordinate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  
  return response.json(); // { action: 'ai_handle', agent: 'radiolinc' }
}
```

### 2. **Orthanc Webhooks → MasterLinc**

**New File:** `~/orthanc-config/orthanc.json`

```json
{
  "Plugins": ["OrthancWebhooks"],
  "OrthancWebhooks": {
    "NewStudy": "http://localhost:4000/api/webhooks/orthanc/new-study",
    "StableStudy": "http://localhost:4000/api/webhooks/orthanc/stable-study"
  }
}
```

**Handler in MasterLinc Coordinator:**
```typescript
app.post('/api/webhooks/orthanc/new-study', async (req, res) => {
  const { StudyInstanceUID } = req.body;
  
  // Trigger RadioLinc triage
  await radioLincAgent.triageNewStudy(StudyInstanceUID);
  
  res.json({ received: true });
});
```

### 3. **Basma Voice AI Integration**

**New Clawdbot Skill:** `~/.clawdbot/skills/basma-voice.js`

```javascript
module.exports = {
  name: 'basma-voice',
  
  async handler(message, context) {
    if (message.type === 'voice') {
      // 1. Convert voice to text (Basma STT)
      const text = await basmaSTT(message.audio);
      
      // 2. Process command
      const response = await masterLinc.process(text);
      
      // 3. Convert response to voice (Basma TTS)
      const audio = await basmaTTS(response);
      
      return { type: 'audio', data: audio };
    }
  }
};
```

---

## 📋 Deployment Checklist

### Phase 1: RadioLinc Agent Setup
- [ ] Create RadioLinc agent package
- [ ] Configure patient/provider workflows
- [ ] Set up call routing rules
- [ ] Test voice interactions

### Phase 2: 3CX Integration
- [ ] Deploy 3CX MCP server
- [ ] Configure Twilio trunk
- [ ] Set up extension mappings
- [ ] Test inbound/outbound calls

### Phase 3: Voice AI (Basma)
- [ ] Integrate Whisper STT
- [ ] Configure OpenAI TTS
- [ ] Create voice command grammar
- [ ] Test voice workflows

### Phase 4: Orthanc Webhooks
- [ ] Enable Orthanc webhook plugin
- [ ] Configure new study events
- [ ] Set up auto-triage
- [ ] Test notification flow

### Phase 5: End-to-End Testing
- [ ] Patient calls in → Gets results
- [ ] Doctor WhatsApp → Study analysis
- [ ] Voice command → Report generation
- [ ] Urgent study → Multi-channel alert

---

## 🎯 Next Steps

1. **Create RadioLinc Agent Package**
   - Define agent behaviors
   - Build routing logic
   - Integrate with existing MasterLinc

2. **Deploy 3CX MCP Server**
   - Build and containerize
   - Connect to MasterLinc coordinator
   - Configure call flows

3. **Integrate Basma Voice AI**
   - Add STT/TTS capabilities
   - Create voice command handlers
   - Test phone interactions

4. **Configure Orthanc Webhooks**
   - Enable webhook plugin
   - Point to MasterLinc
   - Test auto-triage

5. **Build Multi-Channel Demo**
   - Phone call → DICOM results
   - WhatsApp → AI analysis
   - Voice command → Report generation

---

**This creates the ULTIMATE medical imaging platform with:**
- ✅ Multi-channel communication (Phone, WhatsApp, Telegram, Voice)
- ✅ AI-powered triage and analysis
- ✅ Intelligent agent routing (RadioLinc)
- ✅ Voice interactions (Basma)
- ✅ DICOM storage and viewing (Orthanc + OHIF)
- ✅ Complete HIPAA compliance and audit trails

**Ready to build the RadioLinc agent and complete the integration!** 🚀
