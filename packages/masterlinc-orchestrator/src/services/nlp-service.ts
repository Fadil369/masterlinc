import Anthropic from '@anthropic-ai/sdk';
import { pino } from 'pino';

const logger = pino({ name: 'nlp-service' });

export interface ExtractedHealthData {
  symptoms: string[];
  severity: 'emergency' | 'urgent' | 'routine';
  intent: string;
  entities: Record<string, string>;
  summary: string;
}

export class NlpService {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
    });
  }

  /**
   * Extract clinical information and intent from a transcript
   */
  async analyzeTranscript(transcript: string): Promise<ExtractedHealthData> {
    logger.info('Analyzing transcript with Claude');

    const prompt = `Analyze the following healthcare call transcript and extract structured information.
    
Transcript: "${transcript}"

Return ONLY a JSON object with this structure:
{
  "symptoms": ["list of medical symptoms found"],
  "severity": "emergency" | "urgent" | "routine",
  "intent": "the patient's primary goal (e.g., booking, cancellation, inquiry)",
  "entities": { "name": "...", "date": "...", "department": "..." },
  "summary": "a brief 1-sentence summary"
}`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const data = JSON.parse(text);

      return {
        symptoms: data.symptoms || [],
        severity: data.severity || 'routine',
        intent: data.intent || 'inquiry',
        entities: data.entities || {},
        summary: data.summary || '',
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'NLP analysis failed, using fallback');
      return this.fallbackAnalysis(transcript);
    }
  }

  private fallbackAnalysis(transcript: string): ExtractedHealthData {
    const commonSymptoms = [
      'fever', 'cough', 'headache', 'pain', 'nausea', 'vomiting',
      'diarrhea', 'fatigue', 'shortness of breath', 'chest pain',
      'dizziness', 'rash', 'swelling'
    ];

    const symptoms = commonSymptoms.filter((s) =>
      transcript.toLowerCase().includes(s),
    );

    return {
      symptoms: symptoms.length > 0 ? symptoms : ['general'],
      severity: transcript.toLowerCase().includes('pain') ? 'urgent' : 'routine',
      intent: 'inquiry',
      entities: {},
      summary: 'Automated fallback analysis',
    };
  }
}
