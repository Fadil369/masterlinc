import type { Config } from '../config.js';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class BasmaBridge {
  private anthropicKey: string | undefined;
  private openaiKey: string | undefined;

  constructor(config: Config) {
    this.anthropicKey = config.ANTHROPIC_API_KEY;
    this.openaiKey = config.OPENAI_API_KEY;
  }

  async transcribeAudio(audio: Uint8Array, mimeType = 'audio/wav'): Promise<string> {
    if (!this.openaiKey) throw new Error('OPENAI_API_KEY required for STT');

    const boundary = `----basma${Date.now()}`;
    const formBody = this.buildMultipartForm(boundary, audio, mimeType);

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.openaiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: Buffer.from(formBody),
    });

    if (!res.ok) {
      throw new Error(`Whisper STT failed (${res.status}): ${await res.text()}`);
    }
    const json = await res.json() as { text: string };
    return json.text;
  }

  async generateResponse(
    conversationHistory: ConversationMessage[],
    context?: { callerName?: string; callerNumber?: string },
  ): Promise<string> {
    if (!this.anthropicKey) throw new Error('ANTHROPIC_API_KEY required for AI');

    const systemPrompt = this.buildSystemPrompt(context);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: systemPrompt,
        messages: conversationHistory,
      }),
    });

    if (!res.ok) {
      throw new Error(`Claude API failed (${res.status}): ${await res.text()}`);
    }
    const data = await res.json() as { content: Array<{ type: string; text: string }> };
    const textBlock = data.content.find(c => c.type === 'text');
    return textBlock?.text ?? '';
  }

  async synthesizeSpeech(text: string, voice = 'alloy'): Promise<Uint8Array> {
    if (!this.openaiKey) throw new Error('OPENAI_API_KEY required for TTS');

    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice,
        input: text,
        response_format: 'pcm',
      }),
    });

    if (!res.ok) {
      throw new Error(`TTS failed (${res.status}): ${await res.text()}`);
    }
    return new Uint8Array(await res.arrayBuffer());
  }

  async processVoiceInteraction(audio: Uint8Array, history: ConversationMessage[], context?: { callerName?: string; callerNumber?: string }): Promise<{ text: string; audio: Uint8Array }> {
    const userText = await this.transcribeAudio(audio);
    history.push({ role: 'user', content: userText });

    const responseText = await this.generateResponse(history, context);
    history.push({ role: 'assistant', content: responseText });

    const responseAudio = await this.synthesizeSpeech(responseText);
    return { text: responseText, audio: responseAudio };
  }

  private buildSystemPrompt(context?: { callerName?: string; callerNumber?: string }): string {
    let prompt = `You are Basma, the AI voice secretary for BrainSAIT healthcare technology. You handle calls professionally in Arabic and English. Keep responses concise (2-3 sentences) for voice.`;
    if (context?.callerName) prompt += `\nCaller: ${context.callerName}`;
    if (context?.callerNumber) prompt += `\nNumber: ${context.callerNumber}`;
    return prompt;
  }

  private buildMultipartForm(boundary: string, audio: Uint8Array, mimeType: string): Uint8Array {
    const enc = new TextEncoder();
    const parts: Uint8Array[] = [];

    const modelField = enc.encode(
      `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n`
    );
    parts.push(modelField);

    const fileHeader = enc.encode(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="audio.wav"\r\nContent-Type: ${mimeType}\r\n\r\n`
    );
    parts.push(fileHeader);
    parts.push(audio);
    parts.push(enc.encode('\r\n'));

    parts.push(enc.encode(`--${boundary}--\r\n`));

    const totalLen = parts.reduce((sum, p) => sum + p.length, 0);
    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const part of parts) {
      result.set(part, offset);
      offset += part.length;
    }
    return result;
  }
}
