import React from 'react';
import { FunctionDeclaration } from '@google/genai';

export const BASMA_SYSTEM_PROMPT = `
You are Basma (بسمة), the intelligent AI voice secretary for BrainSAIT. 

CORE IDENTITY:
- Role: Executive AI Secretary for BrainSAIT (Healthcare Tech).
- Personality: Warm, professional, detail-oriented, proactive.

REAL-TIME CAPABILITIES:
You are integrated with the BrainSAIT platform. You can:
1. Book appointments using the 'book_appointment' tool.
2. Log call summaries and sentiments using 'record_call_log'.
3. Assign tasks to team members using 'create_task'.
4. Send WhatsApp confirmations using 'send_whatsapp_message'.
5. Send SMS alerts using 'send_sms_message'.
6. Add promising visitors to the Lead pipeline using 'add_to_leads'.

VISITOR & LEAD PROTOCOL:
- Users chatting with you are "Visitors".
- If a visitor shows strong interest, has a budget, or a clear timeline, use 'add_to_leads' to capture their contact info.
- Offer WhatsApp/SMS confirmation after any lead capture or booking.

NEW PROACTIVE FOLLOW-UP PROTOCOLS:
- For tasks: Check status 24h before deadlines.
- For research: Follow up with callers if promised info is missing.

BILINGUAL PROTOCOLS:
- Auto-detect Arabic/English. Use Modern Standard Arabic for formal, Gulf for regional.

BRAINSAIT KNOWLEDGE:
- Products: AI Health Platform, NPHIES, Bilingual EMR, HIPAA Compliance.

OPERATIONAL RULES:
- NEVER accept PHI.
- Sun-Thu 9AM-6PM Saudi time (UTC+3).
- Be helpful, human, and professional.
`;

export const ICON_BASMA = (
  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

export const BASMA_TOOLS: FunctionDeclaration[] = [
  {
    name: 'book_appointment',
    description: 'Schedules a new medical or business appointment in the BrainSAIT calendar.',
    parameters: {
      type: 'OBJECT' as any,
      properties: {
        callerName: { type: 'STRING' as any, description: 'The full name of the person requesting the appointment.' },
        companyName: { type: 'STRING' as any, description: 'Optional company name.' },
        type: { 
          type: 'STRING' as any, 
          enum: ['demo', 'consultation', 'technical_support', 'partnership_discussion'],
          description: 'The category of the appointment.'
        },
        date: { type: 'STRING' as any, description: 'The date of the appointment (YYYY-MM-DD).' },
        time: { type: 'STRING' as any, description: 'The time of the appointment (e.g., 10:00 AM).' }
      },
      required: ['callerName', 'type', 'date', 'time']
    }
  },
  {
    name: 'record_call_log',
    description: 'Logs a summary of the current conversation for internal records. Links to a Visitor profile.',
    parameters: {
      type: 'OBJECT' as any,
      properties: {
        callerName: { type: 'STRING' as any, description: 'Name of the caller.' },
        summary: { type: 'STRING' as any, description: 'A brief 1-2 sentence summary of the call.' },
        sentiment: { 
          type: 'STRING' as any, 
          enum: ['positive', 'neutral', 'negative', 'urgent'],
          description: 'The overall mood of the caller.'
        },
        duration: { type: 'NUMBER' as any, description: 'Approximate duration in seconds.' }
      },
      required: ['callerName', 'summary', 'sentiment']
    }
  },
  {
    name: 'add_to_leads',
    description: 'Converts a visitor into a high-priority Lead.',
    parameters: {
      type: 'OBJECT' as any,
      properties: {
        name: { type: 'STRING' as any, description: 'Full name of the lead.' },
        email: { type: 'STRING' as any, description: 'Email address of the lead.' },
        phone: { type: 'STRING' as any, description: 'Phone number of the lead.' },
        score: { type: 'NUMBER' as any, description: 'Lead quality score (1-100).' }
      },
      required: ['name', 'phone']
    }
  },
  {
    name: 'create_task',
    description: 'Assigns a proactive follow-up task to a BrainSAIT team member or Basma.',
    parameters: {
      type: 'OBJECT' as any,
      properties: {
        title: { type: 'STRING' as any, description: 'Clear title of the task.' },
        assignedTo: { type: 'STRING' as any, description: 'Who is responsible (e.g., CTO, Sales Head, Basma).' },
        deadline: { type: 'STRING' as any, description: 'ISO 8601 timestamp for the deadline.' },
        type: { 
          type: 'STRING' as any, 
          enum: ['internal_assignment', 'research_followup'],
          description: 'The nature of the task.'
        },
        callerName: { type: 'STRING' as any, description: 'Associated caller if it is a research follow-up.' }
      },
      required: ['title', 'assignedTo', 'deadline', 'type']
    }
  },
  {
    name: 'send_whatsapp_message',
    description: 'Sends a confirmation or follow-up message to the caller via WhatsApp.',
    parameters: {
      type: 'OBJECT' as any,
      properties: {
        phoneNumber: { type: 'STRING' as any, description: 'The recipient phone number with country code.' },
        message: { type: 'STRING' as any, description: 'The content of the WhatsApp message.' }
      },
      required: ['phoneNumber', 'message']
    }
  },
  {
    name: 'send_sms_message',
    description: 'Sends a standard SMS text message for confirmation or alerts.',
    parameters: {
      type: 'OBJECT' as any,
      properties: {
        phoneNumber: { type: 'STRING' as any, description: 'The recipient phone number with country code.' },
        message: { type: 'STRING' as any, description: 'The content of the SMS.' }
      },
      required: ['phoneNumber', 'message']
    }
  }
];