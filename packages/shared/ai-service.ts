import Anthropic from '@anthropic-ai/sdk';
import type { Env, ConversationMessage, VisitorData } from '@basma/shared/types';

const BASMA_SYSTEM_PROMPT = `You are **Basma**, the intelligent AI voice secretary for BrainSAIT, a healthcare technology company specializing in HIPAA-compliant, bilingual (Arabic/English) medical systems.

## CORE IDENTITY
- **Name:** Basma (بسمة) - meaning "smile" in Arabic
- **Role:** Executive AI Secretary for BrainSAIT
- **Voice:** Warm, professional, culturally aware, bilingual fluency
- **Tone:** Confident yet approachable, efficient but never rushed

## RESPONSE GUIDELINES
1. Automatically detect caller's language (Arabic/English) and respond accordingly
2. Keep responses concise and natural - this is VOICE conversation
3. Use verbal acknowledgments: "I understand," "Got it," "نعم، فهمت"
4. For appointments, collect: name, contact (phone/email), preferred time, appointment type
5. Be proactive: offer solutions, suggest next steps
6. Handle objections gracefully: "I understand your concern..."
7. Maintain professional boundaries: never discuss PHI (Protected Health Information)

## APPOINTMENT TYPES
- **demo**: Product demonstration (30-45min)
- **consultation**: Technical consultation (60min)
- **partnership**: Partnership discussion (45-60min)
- **support**: Technical support request
- **inquiry**: General information request

## BRAINSAIT OVERVIEW
Healthcare technology company building AI-powered, HIPAA-compliant medical systems with native Arabic-English support. Specializes in NPHIES (Saudi healthcare) integration, FHIR R4 compliance, and clinical decision support.

## CRITICAL RULES
❌ NEVER ask for or accept PHI (patient data)
❌ NEVER discuss patient-specific cases
✅ Always verify information before confirming
✅ Escalate urgent issues immediately
✅ Log all interactions with audit trail

Keep responses natural, brief (2-3 sentences max for voice), and action-oriented.`;

export class AIService {
  private client: Anthropic;
  private model: string;
  
  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model || 'claude-3-5-sonnet-20241022';
  }

  async processCall(
    conversationHistory: ConversationMessage[],
    visitorData: VisitorData
  ): Promise<ReadableStream> {
    const contextPrompt = this.buildContextPrompt(visitorData);
    
    const stream = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      temperature: 0.7,
      system: `${BASMA_SYSTEM_PROMPT}\n\n${contextPrompt}`,
      messages: conversationHistory,
      stream: true,
    });

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && 
                event.delta.type === 'text_delta') {
              const text = event.delta.text;
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });
  }

  async extractVisitorData(transcript: string): Promise<Partial<VisitorData>> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 512,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: `Extract structured data from this call transcript. Return ONLY valid JSON.

Transcript:
${transcript}

Extract:
{
  "name": "full name if mentioned",
  "phone": "phone number if provided",
  "email": "email if provided",
  "company": "company name if mentioned",
  "language": "en" | "ar" | "mixed",
  "appointment_requested": true/false,
  "preferred_time": "any time preference mentioned",
  "inquiry_type": "demo" | "consultation" | "partnership" | "support" | "inquiry"
}

Return NULL for fields not mentioned. Response must be valid JSON only.`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        const extracted = JSON.parse(content.text);
        // Filter out null values
        return Object.fromEntries(
          Object.entries(extracted).filter(([_, v]) => v !== null && v !== undefined)
        );
      } catch (e) {
        console.error('Failed to parse extracted data:', e);
        return {};
      }
    }
    
    return {};
  }

  async generateSummary(conversationHistory: ConversationMessage[]): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 256,
      temperature: 0.5,
      messages: [{
        role: 'user',
        content: `Summarize this call in 2-3 sentences, focusing on: caller's purpose, key information exchanged, and outcome/next steps.

Conversation:
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`
      }]
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  }

  async detectLanguage(text: string): Promise<'en' | 'ar' | 'mixed'> {
    const arabicChars = text.match(/[\u0600-\u06FF]/g);
    const englishChars = text.match(/[a-zA-Z]/g);
    
    if (!arabicChars && englishChars) return 'en';
    if (arabicChars && !englishChars) return 'ar';
    return 'mixed';
  }

  async analyzeSentiment(text: string): Promise<'positive' | 'neutral' | 'negative' | 'urgent'> {
    const urgentKeywords = ['urgent', 'emergency', 'asap', 'عاجل', 'طارئ', 'فوري'];
    const negativeKeywords = ['problem', 'issue', 'angry', 'frustrated', 'مشكلة', 'غاضب', 'منزعج'];
    const positiveKeywords = ['thank', 'great', 'excellent', 'شكرا', 'ممتاز', 'رائع'];
    
    const lowerText = text.toLowerCase();
    
    if (urgentKeywords.some(k => lowerText.includes(k))) return 'urgent';
    if (negativeKeywords.some(k => lowerText.includes(k))) return 'negative';
    if (positiveKeywords.some(k => lowerText.includes(k))) return 'positive';
    
    return 'neutral';
  }

  private buildContextPrompt(visitorData: VisitorData): string {
    const parts = ['## CURRENT CONTEXT'];
    
    if (visitorData.name) parts.push(`Caller Name: ${visitorData.name}`);
    if (visitorData.company) parts.push(`Company: ${visitorData.company}`);
    if (visitorData.language) parts.push(`Language: ${visitorData.language}`);
    if (visitorData.visitorId) parts.push(`Returning Visitor: Yes (ID: ${visitorData.visitorId})`);
    
    return parts.join('\n');
  }
}

export function createAIService(env: Env): AIService {
  return new AIService(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL);
}
