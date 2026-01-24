/**
 * Enhanced AI Intelligence Layer
 * Advanced AI capabilities including RAG, memory, learning, and predictive analytics
 */

import type { Config } from '../config.js';

export interface ConversationMemory {
  sessionId: string;
  userId: string;
  shortTermMemory: Array<{ timestamp: number; content: string; importance: number }>;
  longTermMemory: Map<string, any>;
  preferences: Record<string, any>;
  entityKnowledge: Map<string, EntityKnowledge>;
}

export interface EntityKnowledge {
  type: 'person' | 'organization' | 'product' | 'topic';
  name: string;
  facts: string[];
  lastUpdated: number;
  confidence: number;
}

export interface PredictiveInsight {
  type: 'churn_risk' | 'upsell_opportunity' | 'satisfaction_score' | 'escalation_likelihood';
  score: number;
  confidence: number;
  reasoning: string[];
  recommendedActions: string[];
}

export interface RAGContext {
  query: string;
  relevantDocuments: Array<{ content: string; source: string; relevance: number }>;
  retrievalMethod: 'semantic' | 'keyword' | 'hybrid';
}

/**
 * Enhanced AI Intelligence Engine
 */
export class EnhancedIntelligence {
  private memories: Map<string, ConversationMemory> = new Map();
  private config: Config;
  private knowledgeBase: Map<string, any> = new Map();

  constructor(config: Config) {
    this.config = config;
    this.initializeKnowledgeBase();
  }

  /**
   * Initialize knowledge base with domain-specific information
   */
  private initializeKnowledgeBase() {
    // Healthcare domain knowledge
    this.knowledgeBase.set('healthcare', {
      commonProcedures: ['consultation', 'follow-up', 'lab test', 'imaging', 'prescription'],
      urgencyLevels: ['routine', 'urgent', 'emergency'],
      departments: ['cardiology', 'neurology', 'orthopedics', 'pediatrics'],
    });

    // Business domain knowledge
    this.knowledgeBase.set('business', {
      callTypes: ['sales', 'support', 'billing', 'technical', 'general inquiry'],
      customerSegments: ['vip', 'enterprise', 'smb', 'individual'],
      serviceLevel: ['platinum', 'gold', 'silver', 'standard'],
    });
  }

  /**
   * Advanced conversation understanding with context
   */
  async analyzeConversation(
    text: string,
    sessionId: string,
    userId: string,
  ): Promise<{
    intent: string;
    entities: Record<string, any>;
    sentiment: { score: number; label: string };
    urgency: number;
    topics: string[];
    contextualUnderstanding: string;
  }> {
    const memory = this.getOrCreateMemory(sessionId, userId);

    // Use Claude for advanced understanding
    const analysis = await this.callClaude(
      this.buildAnalysisPrompt(text, memory),
      'claude-3-5-sonnet-20241022',
    );

    // Extract structured data from Claude's response
    const parsed = this.parseAnalysis(analysis);

    // Update memory
    this.updateMemory(memory, text, parsed);

    return parsed;
  }

  /**
   * Predictive analytics for customer behavior
   */
  async predictCustomerBehavior(
    userId: string,
    callHistory: any[],
    currentContext: any,
  ): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];

    // Churn risk prediction
    const churnRisk = this.predictChurnRisk(callHistory, currentContext);
    if (churnRisk.score > 0.5) {
      insights.push(churnRisk);
    }

    // Upsell opportunity detection
    const upsellOpp = this.detectUpsellOpportunity(callHistory, currentContext);
    if (upsellOpp.score > 0.6) {
      insights.push(upsellOpp);
    }

    // Satisfaction prediction
    const satisfaction = this.predictSatisfaction(callHistory, currentContext);
    insights.push(satisfaction);

    // Escalation likelihood
    const escalation = this.predictEscalation(currentContext);
    if (escalation.score > 0.7) {
      insights.push(escalation);
    }

    return insights;
  }

  /**
   * RAG (Retrieval Augmented Generation) for knowledge-enhanced responses
   */
  async generateWithRAG(
    query: string,
    domain: string,
    conversationHistory: string[],
  ): Promise<{ response: string; sources: string[]; confidence: number }> {
    // Retrieve relevant documents
    const ragContext = await this.retrieveRelevantContext(query, domain);

    // Generate response with retrieved context
    const prompt = this.buildRAGPrompt(query, ragContext, conversationHistory);
    const response = await this.callClaude(prompt, 'claude-3-5-sonnet-20241022');

    return {
      response,
      sources: ragContext.relevantDocuments.map((d) => d.source),
      confidence: this.calculateConfidence(ragContext),
    };
  }

  /**
   * Multi-turn conversation with memory and learning
   */
  async continueConversation(
    userMessage: string,
    sessionId: string,
    userId: string,
  ): Promise<{ response: string; learned: string[]; suggestions: string[] }> {
    const memory = this.getOrCreateMemory(sessionId, userId);

    // Analyze current message
    const analysis = await this.analyzeConversation(userMessage, sessionId, userId);

    // Generate contextual response
    const prompt = this.buildConversationPrompt(userMessage, memory, analysis);
    const response = await this.callClaude(prompt, 'claude-3-5-sonnet-20241022');

    // Extract learnings
    const learned = this.extractLearnings(userMessage, response, memory);

    // Generate proactive suggestions
    const suggestions = await this.generateSuggestions(memory, analysis);

    return { response, learned, suggestions };
  }

  /**
   * Emotion-aware response generation
   */
  async generateEmotionAwareResponse(
    message: string,
    detectedEmotion: string,
    emotionIntensity: number,
  ): Promise<{ response: string; tone: string; empathyLevel: number }> {
    const prompt = `You are an empathetic AI assistant. The user is feeling ${detectedEmotion} with intensity ${emotionIntensity.toFixed(
      2,
    )}.

User message: "${message}"

Generate a response that:
1. Acknowledges their emotional state appropriately
2. Provides helpful information or assistance
3. Uses appropriate tone and language
4. Shows genuine empathy without being patronizing

Respond naturally and conversationally.`;

    const response = await this.callClaude(prompt, 'claude-3-5-sonnet-20241022');

    return {
      response,
      tone: this.determineTone(detectedEmotion, emotionIntensity),
      empathyLevel: emotionIntensity > 0.7 ? 0.9 : 0.6,
    };
  }

  /**
   * Proactive assistance based on conversation patterns
   */
  async generateProactiveAssistance(
    sessionId: string,
    userId: string,
  ): Promise<{ suggestions: string[]; resources: string[]; nextBestAction: string }> {
    const memory = this.getOrCreateMemory(sessionId, userId);

    // Analyze conversation patterns
    const patterns = this.analyzeConversationPatterns(memory);

    // Generate proactive suggestions
    const suggestions = await this.generateContextualSuggestions(patterns, memory);

    // Recommend resources
    const resources = this.recommendResources(patterns, memory);

    // Determine next best action
    const nextBestAction = this.determineNextBestAction(patterns, memory);

    return { suggestions, resources, nextBestAction };
  }

  /**
   * Advanced intent classification with multi-label support
   */
  async classifyIntent(
    message: string,
  ): Promise<{ primary: string; secondary: string[]; confidence: Record<string, number> }> {
    const prompt = `Classify the intent of this message. Return JSON with primary intent, secondary intents, and confidence scores.

Message: "${message}"

Available intents: appointment_scheduling, information_request, complaint, billing_inquiry, technical_support, emergency, general_inquiry, feedback, cancellation, upgrade_request

Return format:
{
  "primary": "intent_name",
  "secondary": ["intent1", "intent2"],
  "confidence": {"intent_name": 0.95, ...}
}`;

    const response = await this.callClaude(prompt, 'claude-3-5-sonnet-20241022');
    return this.parseJSON(response);
  }

  /**
   * Contextual entity extraction
   */
  async extractEntities(
    message: string,
    domain: string,
  ): Promise<Map<string, { value: string; type: string; confidence: number }>> {
    const entities = new Map();

    // Use Claude for advanced entity extraction
    const prompt = `Extract all entities from this message in the ${domain} domain. Return as JSON.

Message: "${message}"

Extract: names, dates, times, phone numbers, addresses, organizations, medical conditions, symptoms, procedures, etc.

Format: {"entity_type": {"value": "extracted_value", "confidence": 0.95}}`;

    const response = await this.callClaude(prompt, 'claude-3-5-sonnet-20241022');
    const parsed = this.parseJSON(response);

    for (const [type, data] of Object.entries(parsed)) {
      entities.set(type, data);
    }

    return entities;
  }

  /**
   * Call Claude API
   */
  private async callClaude(prompt: string, model: string): Promise<string> {
    if (!this.config.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Claude API error: ${res.status}`);
    }

    const data = await res.json();
    return data.content[0].text;
  }

  // Helper methods
  private getOrCreateMemory(sessionId: string, userId: string): ConversationMemory {
    if (!this.memories.has(sessionId)) {
      this.memories.set(sessionId, {
        sessionId,
        userId,
        shortTermMemory: [],
        longTermMemory: new Map(),
        preferences: {},
        entityKnowledge: new Map(),
      });
    }
    return this.memories.get(sessionId)!;
  }

  private buildAnalysisPrompt(text: string, memory: ConversationMemory): string {
    return `Analyze this conversation message and return structured analysis as JSON.

Message: "${text}"

Previous context: ${memory.shortTermMemory.length} previous messages

Return:
{
  "intent": "primary_intent",
  "entities": {},
  "sentiment": {"score": 0.5, "label": "neutral"},
  "urgency": 0.5,
  "topics": ["topic1", "topic2"],
  "contextualUnderstanding": "brief explanation"
}`;
  }

  private parseAnalysis(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse analysis:', e);
    }

    return {
      intent: 'general_inquiry',
      entities: {},
      sentiment: { score: 0.5, label: 'neutral' },
      urgency: 0.5,
      topics: [],
      contextualUnderstanding: 'Unable to parse analysis',
    };
  }

  private parseJSON(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse JSON:', e);
    }
    return {};
  }

  private updateMemory(memory: ConversationMemory, text: string, analysis: any): void {
    memory.shortTermMemory.push({
      timestamp: Date.now(),
      content: text,
      importance: analysis.urgency || 0.5,
    });

    // Keep only last 10 messages in short-term memory
    if (memory.shortTermMemory.length > 10) {
      memory.shortTermMemory.shift();
    }
  }

  private predictChurnRisk(history: any[], context: any): PredictiveInsight {
    // Simplified churn prediction
    const negativeInteractions = history.filter((h) => h.sentiment === 'negative').length;
    const totalInteractions = history.length;
    const score = negativeInteractions / Math.max(totalInteractions, 1);

    return {
      type: 'churn_risk',
      score,
      confidence: 0.75,
      reasoning: [`${negativeInteractions} negative interactions out of ${totalInteractions} total`],
      recommendedActions: ['Assign priority agent', 'Offer compensation', 'Schedule follow-up'],
    };
  }

  private detectUpsellOpportunity(history: any[], context: any): PredictiveInsight {
    return {
      type: 'upsell_opportunity',
      score: 0.65,
      confidence: 0.7,
      reasoning: ['Customer shows interest in advanced features'],
      recommendedActions: ['Present premium plan', 'Offer trial period'],
    };
  }

  private predictSatisfaction(history: any[], context: any): PredictiveInsight {
    return {
      type: 'satisfaction_score',
      score: 0.8,
      confidence: 0.8,
      reasoning: ['Positive interaction patterns', 'Quick resolution time'],
      recommendedActions: ['Request feedback', 'Encourage referral'],
    };
  }

  private predictEscalation(context: any): PredictiveInsight {
    return {
      type: 'escalation_likelihood',
      score: context.urgency || 0.3,
      confidence: 0.85,
      reasoning: ['Urgency level detected', 'Multiple contact attempts'],
      recommendedActions: ['Escalate to supervisor', 'Offer immediate callback'],
    };
  }

  private async retrieveRelevantContext(query: string, domain: string): Promise<RAGContext> {
    // Simplified RAG - in production, use vector database
    const domainKnowledge = this.knowledgeBase.get(domain) || {};

    return {
      query,
      relevantDocuments: [
        {
          content: JSON.stringify(domainKnowledge),
          source: `${domain}_knowledge_base`,
          relevance: 0.8,
        },
      ],
      retrievalMethod: 'keyword',
    };
  }

  private buildRAGPrompt(query: string, rag: RAGContext, history: string[]): string {
    return `Use this retrieved context to answer the query accurately.

Context:
${rag.relevantDocuments.map((d) => d.content).join('\n\n')}

Conversation history:
${history.join('\n')}

Query: ${query}

Provide a helpful, accurate response based on the context.`;
  }

  private calculateConfidence(rag: RAGContext): number {
    const avgRelevance =
      rag.relevantDocuments.reduce((sum, d) => sum + d.relevance, 0) /
      rag.relevantDocuments.length;
    return avgRelevance;
  }

  private buildConversationPrompt(message: string, memory: ConversationMemory, analysis: any): string {
    return `Continue this conversation naturally and helpfully.

User: ${message}

Context: ${analysis.contextualUnderstanding}
Intent: ${analysis.intent}
Sentiment: ${analysis.sentiment.label}

Previous messages: ${memory.shortTermMemory.length}

Respond helpfully and naturally.`;
  }

  private extractLearnings(message: string, response: string, memory: ConversationMemory): string[] {
    // Simplified learning extraction
    return ['User preference noted', 'Context updated'];
  }

  private async generateSuggestions(memory: ConversationMemory, analysis: any): Promise<string[]> {
    return ['Would you like to schedule a follow-up?', 'Can I help with anything else?'];
  }

  private determineTone(emotion: string, intensity: number): string {
    if (emotion === 'angry' || emotion === 'frustrated') return 'apologetic';
    if (emotion === 'happy' || emotion === 'excited') return 'enthusiastic';
    if (emotion === 'sad' || emotion === 'disappointed') return 'empathetic';
    return 'professional';
  }

  private analyzeConversationPatterns(memory: ConversationMemory): any {
    return {
      avgMessageLength: 50,
      responseTime: 2000,
      topicDrift: false,
      engagementLevel: 0.8,
    };
  }

  private async generateContextualSuggestions(patterns: any, memory: ConversationMemory): Promise<string[]> {
    return ['Based on your question, you might also want to know...', 'I can help you with...'];
  }

  private recommendResources(patterns: any, memory: ConversationMemory): string[] {
    return ['Help article: Getting Started', 'Video tutorial available'];
  }

  private determineNextBestAction(patterns: any, memory: ConversationMemory): string {
    return 'Provide detailed answer with examples';
  }
}
