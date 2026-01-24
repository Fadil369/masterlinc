/**
 * Enhanced Basma Integration
 * Advanced voice AI with emotion detection, multi-language support, and context awareness
 */

import type { Config } from '../config.js';

export interface VoiceProfile {
  voice: string;
  language: string;
  speed: number;
  pitch: number;
  emotion: 'neutral' | 'friendly' | 'professional' | 'empathetic' | 'enthusiastic';
}

export interface ConversationContext {
  sessionId: string;
  caller: string;
  language: string;
  detectedIntent: string;
  entities: Record<string, any>;
  sentiment: 'positive' | 'negative' | 'neutral';
  emotionScore: number;
  conversationHistory: Array<{ role: string; content: string; timestamp: number }>;
  metadata: Record<string, any>;
}

export class BasmaEnhanced {
  private config: Config;
  private sessions: Map<string, ConversationContext> = new Map();

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Start AI conversation for a call
   */
  async startConversation(
    callId: string,
    caller: string,
    options?: Partial<VoiceProfile>,
  ): Promise<ConversationContext> {
    const context: ConversationContext = {
      sessionId: callId,
      caller,
      language: options?.language || 'en',
      detectedIntent: '',
      entities: {},
      sentiment: 'neutral',
      emotionScore: 0.5,
      conversationHistory: [],
      metadata: {},
    };

    this.sessions.set(callId, context);
    console.log(`[Basma] Started conversation for call ${callId}`);

    return context;
  }

  /**
   * Process audio and generate response
   */
  async processAudio(
    callId: string,
    audioBuffer: Buffer,
  ): Promise<{ text: string; response: string; audioResponse: Buffer }> {
    const context = this.sessions.get(callId);
    if (!context) {
      throw new Error(`No active session for call ${callId}`);
    }

    // 1. Speech-to-Text (Whisper)
    const transcribedText = await this.speechToText(audioBuffer, context.language);
    console.log(`[Basma] Transcribed: "${transcribedText}"`);

    // 2. Detect sentiment and emotion
    const { sentiment, emotionScore } = await this.analyzeSentiment(transcribedText);
    context.sentiment = sentiment;
    context.emotionScore = emotionScore;

    // 3. Extract intent and entities
    const { intent, entities } = await this.extractIntent(transcribedText);
    context.detectedIntent = intent;
    context.entities = { ...context.entities, ...entities };

    // 4. Add to conversation history
    context.conversationHistory.push({
      role: 'user',
      content: transcribedText,
      timestamp: Date.now(),
    });

    // 5. Generate AI response using Claude
    const aiResponse = await this.generateResponse(context);
    context.conversationHistory.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: Date.now(),
    });

    // 6. Text-to-Speech (OpenAI TTS)
    const audioResponse = await this.textToSpeech(aiResponse, context.language);

    return {
      text: transcribedText,
      response: aiResponse,
      audioResponse,
    };
  }

  /**
   * Speech-to-Text using Whisper API
   */
  private async speechToText(audioBuffer: Buffer, language: string): Promise<string> {
    if (!this.config.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');
    if (language !== 'auto') {
      formData.append('language', language);
    }

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.OPENAI_API_KEY}`,
      },
      body: formData as any,
    });

    if (!res.ok) {
      throw new Error(`Whisper API error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return data.text;
  }

  /**
   * Generate AI response using Claude
   */
  private async generateResponse(context: ConversationContext): Promise<string> {
    if (!this.config.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    const systemPrompt = this.buildSystemPrompt(context);
    const messages = context.conversationHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!res.ok) {
      throw new Error(`Claude API error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return data.content[0].text;
  }

  /**
   * Build system prompt based on context
   */
  private buildSystemPrompt(context: ConversationContext): string {
    const emotionGuidance = this.getEmotionGuidance(context.sentiment, context.emotionScore);

    return `You are Basma, an AI assistant for BrainSAIT telephony system.

Current Context:
- Caller: ${context.caller}
- Language: ${context.language}
- Detected Intent: ${context.detectedIntent || 'unknown'}
- Sentiment: ${context.sentiment} (score: ${context.emotionScore.toFixed(2)})

${emotionGuidance}

Guidelines:
1. Be professional, friendly, and helpful
2. Keep responses concise (2-3 sentences) for phone conversations
3. Adapt your tone to the caller's emotional state
4. Ask clarifying questions when intent is unclear
5. Provide specific information and actionable next steps
6. If you cannot help, offer to transfer to a human agent

Available Actions:
- Transfer call to extension or department
- Schedule callback
- Take message
- Provide information about services
- Handle basic inquiries

Respond naturally as if speaking on the phone.`;
  }

  /**
   * Get emotion-specific guidance
   */
  private getEmotionGuidance(sentiment: string, score: number): string {
    if (sentiment === 'negative' && score < 0.3) {
      return 'The caller seems frustrated or upset. Be extra empathetic and patient.';
    } else if (sentiment === 'positive' && score > 0.7) {
      return 'The caller is in a good mood. Match their positive energy.';
    }
    return 'The caller has a neutral tone. Be professional and helpful.';
  }

  /**
   * Text-to-Speech using OpenAI TTS
   */
  private async textToSpeech(text: string, language: string): Promise<Buffer> {
    if (!this.config.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const voice = this.selectVoiceForLanguage(language);

    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice,
        input: text,
        speed: 1.0,
      }),
    });

    if (!res.ok) {
      throw new Error(`TTS API error: ${res.status} ${await res.text()}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Select appropriate voice for language
   */
  private selectVoiceForLanguage(language: string): string {
    const voiceMap: Record<string, string> = {
      en: 'alloy',
      ar: 'shimmer',
      es: 'nova',
      fr: 'onyx',
      de: 'fable',
      it: 'echo',
    };
    return voiceMap[language] || 'alloy';
  }

  /**
   * Analyze sentiment of text
   */
  private async analyzeSentiment(
    text: string,
  ): Promise<{ sentiment: 'positive' | 'negative' | 'neutral'; emotionScore: number }> {
    // Simple keyword-based sentiment (in production, use proper NLP service)
    const positiveWords = ['thank', 'great', 'excellent', 'perfect', 'wonderful', 'happy'];
    const negativeWords = ['problem', 'issue', 'bad', 'terrible', 'angry', 'frustrated', 'upset'];

    const lowerText = text.toLowerCase();
    let score = 0.5;

    positiveWords.forEach((word) => {
      if (lowerText.includes(word)) score += 0.1;
    });

    negativeWords.forEach((word) => {
      if (lowerText.includes(word)) score -= 0.1;
    });

    score = Math.max(0, Math.min(1, score));

    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (score > 0.6) sentiment = 'positive';
    if (score < 0.4) sentiment = 'negative';

    return { sentiment, emotionScore: score };
  }

  /**
   * Extract intent and entities from text
   */
  private async extractIntent(
    text: string,
  ): Promise<{ intent: string; entities: Record<string, any> }> {
    const lowerText = text.toLowerCase();

    // Intent detection (simplified)
    let intent = 'general_inquiry';

    if (lowerText.includes('appointment') || lowerText.includes('schedule')) {
      intent = 'schedule_appointment';
    } else if (lowerText.includes('transfer') || lowerText.includes('speak to')) {
      intent = 'request_transfer';
    } else if (lowerText.includes('information') || lowerText.includes('tell me about')) {
      intent = 'request_information';
    } else if (lowerText.includes('problem') || lowerText.includes('issue')) {
      intent = 'report_problem';
    } else if (lowerText.includes('callback') || lowerText.includes('call me back')) {
      intent = 'request_callback';
    }

    return {
      intent,
      entities: {},
    };
  }

  /**
   * End conversation
   */
  async endConversation(callId: string): Promise<ConversationContext | undefined> {
    const context = this.sessions.get(callId);
    if (context) {
      console.log(`[Basma] Ended conversation for call ${callId}`);
      this.sessions.delete(callId);
    }
    return context;
  }

  /**
   * Get active session
   */
  getSession(callId: string): ConversationContext | undefined {
    return this.sessions.get(callId);
  }
}
