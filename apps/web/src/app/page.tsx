"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { CallStatus, Appointment, CallLog, ProactiveTask, Visitor, VisitorSegment, Lead, Attribute, Entity } from '../types';
import { BASMA_SYSTEM_PROMPT, ICON_BASMA, BASMA_TOOLS } from '../constants';
import { encode, decode, decodeAudioData } from '../services/audio-utils';
import CallControl from '../components/CallControl';
import VoicePulse from '../components/VoicePulse';
import { api } from '../services/api';

interface SentMessage {
  id: string;
  type: 'whatsapp' | 'sms';
  recipient: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered';
}

// Mock Data (Fallback)
const MOCK_APPOINTMENTS: Appointment[] = [
  { id: '1', callerName: 'Dr. Faisal Al-Zahrani', companyName: 'Riyadh Medical Center', type: 'demo', date: '2024-10-25', time: '10:00 AM', status: 'confirmed' },
  { id: '2', callerName: 'Sarah Jenkins', companyName: 'HealthNet Systems', type: 'partnership_discussion', date: '2024-10-26', time: '1:30 PM', status: 'pending' },
];

const MOCK_LOGS: CallLog[] = [
  { id: '1', timestamp: '2024-10-23 14:20', duration: 180, callerName: 'Ahmed Mansour', summary: 'Inquired about NPHIES integration costs and timeline.', sentiment: 'neutral', visitorId: 'v1' },
  { id: '2', timestamp: '2024-10-23 16:45', duration: 420, callerName: 'Lina Al-Otaibi', summary: 'Urgent request regarding HIPAA audit logs accessibility.', sentiment: 'urgent', visitorId: 'v2' },
];

const MOCK_VISITORS: Visitor[] = [
  { id: 'v1', name: 'Ahmed Mansour', lastSeen: '2024-10-23 14:20', segmentId: 's1', totalCalls: 1, source: 'elfadil.com' },
  { id: 'v2', name: 'Lina Al-Otaibi', lastSeen: '2024-10-23 16:45', segmentId: 's2', totalCalls: 1, source: 'Direct' },
  { id: 'v3', name: 'Guest #829', lastSeen: '2024-10-24 09:15', totalCalls: 1, source: 'thefadil.site' },
];

const MOCK_SEGMENTS: VisitorSegment[] = [
  { id: 's1', name: 'Enterprise Leads', description: 'Large scale medical centers.', criteria: 'Calls > 2 OR Lead Score > 80', visitorCount: 1, color: 'bg-purple-100 text-purple-700' },
  { id: 's2', name: 'Urgent Support', description: 'Technical or compliance emergencies.', criteria: 'Sentiment == urgent', visitorCount: 1, color: 'bg-red-100 text-red-700' },
];

const MOCK_TASKS: ProactiveTask[] = [
  { id: 't1', title: 'NPHIES Documentation Review', assignedTo: 'CTO', deadline: '2024-10-25T09:00:00', status: 'pending', type: 'internal_assignment', reminderSent: false },
  { id: 't2', title: 'Follow-up: Lab Integration Pricing', assignedTo: 'Basma', callerName: 'Dr. Faisal Al-Zahrani', deadline: '2024-10-24T16:00:00', status: 'flagged', type: 'research_followup', reminderSent: true },
];

const MOCK_ATTRIBUTES: Attribute[] = [
  { id: 'a1', key: 'preferred_language', type: 'text', description: 'User language preference', defaultValue: 'ar' },
  { id: 'a2', key: 'is_healthcare_provider', type: 'boolean', description: 'Identity verification flag', defaultValue: 'false' },
];

const MOCK_ENTITIES: Entity[] = [
  { id: 'e1', name: 'NPHIES', synonyms: ['Insurance Portal', 'Saudi Exchange'], description: 'Unified health insurance platform' },
  { id: 'e2', name: 'BrainSAIT', synonyms: ['BS AI', 'Our platform'], description: 'Parent AI healthcare brand' },
];

export default function Page() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [logs, setLogs] = useState<CallLog[]>(MOCK_LOGS);
  const [tasks, setTasks] = useState<ProactiveTask[]>(MOCK_TASKS);
  const [visitors, setVisitors] = useState<Visitor[]>(MOCK_VISITORS);
  const [segments] = useState<VisitorSegment[]>(MOCK_SEGMENTS);
  const [attributes, setAttributes] = useState<Attribute[]>(MOCK_ATTRIBUTES);
  const [entities, setEntities] = useState<Entity[]>(MOCK_ENTITIES);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);
  const [userRole] = useState<'Admin' | 'Owner' | 'Editor'>('Admin');

  // Audio State Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  // Initialize Data from Backend (CRM)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboard = await api.getDashboard();
        if (dashboard.appointments) setAppointments(dashboard.appointments);
        if (dashboard.logs) setLogs(dashboard.logs);
        if (dashboard.visitors) setVisitors(dashboard.visitors);
        if (dashboard.leads) setLeads(dashboard.leads);
      } catch (e) {
        console.error("Failed to fetch dashboard data, using mocks", e);
      }
    };
    fetchData();
  }, []);

  // Proactive Logic
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = new Date();
      setTasks(prevTasks => prevTasks.map(task => {
        const deadline = new Date(task.deadline);
        const diffMs = deadline.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffMs < 0 && task.status !== 'overdue' && task.status !== 'completed') return { ...task, status: 'overdue' as const };
        if (diffHours > 0 && diffHours <= 24 && !task.reminderSent && task.status === 'pending') return { ...task, reminderSent: true, status: 'flagged' as const };
        return task;
      }));
    }, 10000);
    return () => clearInterval(checkInterval);
  }, []);

  const activeRemindersCount = useMemo(() => tasks.filter(t => t.status === 'flagged' || t.status === 'overdue').length, [tasks]);

  const handleToolCall = useCallback(async (fc: any) => {
    console.log(`[Basma Platform Integration] Tool Execution: ${fc.name}`, fc.args);
    let result = "Action successfully executed in BrainSAIT platform.";
    
    try {
      switch (fc.name) {
        case 'book_appointment':
          const newApt: any = {
            id: Math.random().toString(36).substr(2, 9),
            title: `Appointment with ${fc.args.callerName}`,
            description: fc.args.companyName,
            type: fc.args.type,
            start_time: new Date(`${fc.args.date} ${fc.args.time}`).getTime(),
            end_time: new Date(`${fc.args.date} ${fc.args.time}`).getTime() + 30*60000,
            status: 'confirmed',
            callerName: fc.args.callerName, // Legacy for UI
            time: fc.args.time, // Legacy for UI
            date: fc.args.date, // Legacy for UI
            companyName: fc.args.companyName
          };
          // Call API
          await api.createAppointment({
             ...newApt,
             user_id: 'system',
             timezone: 'Asia/Riyadh'
          });
          setAppointments(prev => [newApt, ...prev]);
          result = `Confirmed: Appointment for ${fc.args.callerName} on ${fc.args.date} at ${fc.args.time} has been added to the calendar.`;
          break;

        case 'record_call_log':
          const vId = 'v' + Math.random().toString(36).substr(2, 5);
          const newLog: any = {
             callerName: fc.args.callerName,
             summary: fc.args.summary,
             sentiment: fc.args.sentiment,
             duration: fc.args.duration || 120,
             visitorId: vId
          };
          
          await api.createLog(newLog);
          await api.createVisitor({
             name: fc.args.callerName,
             lastSeen: new Date().toISOString(),
             source: 'Incoming Call'
          });

          const newLogUI: CallLog = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleString(),
            duration: fc.args.duration || 0,
            callerName: fc.args.callerName,
            summary: fc.args.summary,
            sentiment: fc.args.sentiment,
            visitorId: vId
          };
          
          setLogs(prev => [newLogUI, ...prev]);
          // setVisitors handled by simple re-fetch or optimistically
          setVisitors(prev => [{ id: vId, name: fc.args.callerName, lastSeen: new Date().toLocaleString(), totalCalls: 1, source: 'Incoming Call' }, ...prev]);
          result = "Call summary recorded and visitor profile updated.";
          break;

        case 'add_to_leads':
          const newLead: any = {
             name: fc.args.name,
             email: fc.args.email,
             phone: fc.args.phone,
             score: fc.args.score || 50,
             status: 'new'
          };
          
          await api.createVisitor({
             ...newLead,
             lead_score: newLead.score,
             source: 'Basma Lead'
          });
          
          const newLeadUI: Lead = {
            id: 'l' + Math.random().toString(36).substr(2, 5),
            visitorId: 'unknown',
            name: fc.args.name,
            email: fc.args.email,
            phone: fc.args.phone,
            score: fc.args.score || 50,
            status: 'new',
            createdAt: new Date().toISOString()
          };
          setLeads(prev => [newLeadUI, ...prev]);
          result = `Lead ${fc.args.name} added to the pipeline. Score: ${fc.args.score || 50}`;
          break;

        case 'send_whatsapp_message':
        case 'send_sms_message':
          const isWA = fc.name === 'send_whatsapp_message';
          
          await api.sendMessage({
             channel: isWA ? 'whatsapp' : 'sms',
             recipient: fc.args.phoneNumber,
             content: fc.args.message
          });

          const msg: SentMessage = {
            id: Math.random().toString(36).substr(2, 9),
            type: isWA ? 'whatsapp' : 'sms',
            recipient: fc.args.phoneNumber,
            content: fc.args.message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'delivered'
          };
          setSentMessages(prev => [msg, ...prev]);
          result = `${isWA ? 'WhatsApp' : 'SMS'} message sent to ${fc.args.phoneNumber}.`;
          break;

        case 'create_task':
             // Just local state for now as 'tasks' endpoint wasn't fully mocked on backend in this turn
             const newTask: ProactiveTask = {
               id: Math.random().toString(36).substr(2,9),
               title: fc.args.title,
               assignedTo: fc.args.assignedTo,
               deadline: fc.args.deadline,
               status: 'pending',
                type: fc.args.type,
                reminderSent: false,
                callerName: fc.args.callerName
             };
             setTasks(prev => [newTask, ...prev]);
             result = `Task assigned to ${fc.args.assignedTo}: ${fc.args.title}`;
          break;

        default:
          result = "Error: Unknown tool.";
      }
    } catch (e: any) {
      console.error("Tool execution failed", e);
      result = `Error executing tool ${fc.name}: ${e.message}`;
    }

    if (sessionRef.current) {
      sessionRef.current.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: { result } }] });
    }
  }, []);

  const startCall = useCallback(async () => {
    try {
      setCallStatus(CallStatus.CONNECTING);
      // Use env var for API Key
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        alert("API Key missing! Set NEXT_PUBLIC_GEMINI_API_KEY in .env");
        setCallStatus(CallStatus.ERROR);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.0-flash-exp', // Updated to latest available model or user specific
        callbacks: {
          onopen: () => {
            setCallStatus(CallStatus.ACTIVE);
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) { int16[i] = inputData[i] * 32768; }
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              if (sessionRef.current) { sessionRef.current.sendRealtimeInput([{ mimeType: pcmBlob.mimeType, data: pcmBlob.data }]); }
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall && message.toolCall.functionCalls) { 
                for (const fc of message.toolCall.functionCalls) handleToolCall(fc); 
            }
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => { sourcesRef.current.delete(source); });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) { 
                sourcesRef.current.forEach(s => s.stop()); 
                sourcesRef.current.clear(); 
                nextStartTimeRef.current = 0; 
            }
          },
          onerror: (e) => {
              console.error(e);
              setCallStatus(CallStatus.ERROR);
          },
          onclose: () => setCallStatus(CallStatus.INACTIVE),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: BASMA_SYSTEM_PROMPT,
          tools: [{ functionDeclarations: BASMA_TOOLS }],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });
      sessionRef.current = await sessionPromise;
    } catch (err) { 
        console.error(err);
        setCallStatus(CallStatus.ERROR); 
    }
  }, [handleToolCall]);

  const endCall = useCallback(() => {
    if (sessionRef.current) { sessionRef.current.close(); sessionRef.current = null; }
    if (inputAudioContextRef.current) { inputAudioContextRef.current.close(); inputAudioContextRef.current = null; }
    if (outputAudioContextRef.current) { outputAudioContextRef.current.close(); outputAudioContextRef.current = null; }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setCallStatus(CallStatus.INACTIVE);
  }, []);

  const DashboardView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-2 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-3xl shadow-sm border border-red-100 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <span className="text-sm font-bold text-red-600">Proactive Alerts</span>
              </div>
              <h3 className="text-gray-900 text-lg font-bold">Pending Reminders</h3>
              <div className="mt-4 space-y-3">
                {tasks.filter(t => t.status === 'flagged' || t.status === 'overdue').map(task => (
                  <div key={task.id} className="p-4 rounded-2xl border bg-red-50 border-red-100">
                    <p className="text-xs font-bold text-red-700 uppercase mb-1">{task.status}</p>
                    <p className="text-sm font-semibold text-gray-800">{task.title}</p>
                    <button onClick={() => alert('Nudge sent.')} className="mt-3 w-full py-2 bg-red-600 text-white text-xs font-bold rounded-xl">Prompt {task.assignedTo}</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="glass p-6 rounded-3xl shadow-sm border border-blue-100">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <span className="text-sm font-bold text-blue-600">Growth Trends</span>
            </div>
            <h3 className="text-gray-900 text-lg font-bold">New Leads Captured</h3>
            <p className="text-3xl font-black text-blue-600 mt-2">{leads.length}</p>
            <p className="text-xs text-gray-500 mt-1">Converted from Visitors today</p>
          </div>
        </div>
        <div className="glass p-6 rounded-3xl shadow-sm border border-white/50 overflow-hidden">
          <h3 className="text-lg font-bold mb-6">Upcoming Appointments</h3>
          <table className="w-full text-left">
            <thead><tr className="border-b border-gray-100 text-gray-500 text-sm"><th className="pb-4">Caller</th><th className="pb-4">Type</th><th className="pb-4">Time</th><th className="pb-4">Status</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {appointments.map(apt => (
                <tr key={apt.id} className="hover:bg-white/50"><td className="py-4 font-semibold text-gray-900">{apt.callerName}</td><td className="py-4"><span className="text-xs px-2 py-1 rounded-lg bg-gray-100">{apt.type}</span></td><td className="py-4 text-sm">{apt.time || new Date(apt.date).toLocaleTimeString()}</td><td className="py-4"><span className="text-xs px-2 py-1 rounded-full font-bold bg-green-100 text-green-700 uppercase">{apt.status}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="space-y-8">
        <div className="glass p-6 rounded-3xl shadow-sm border border-white/50">
          <h3 className="text-lg font-bold mb-6">Omnichannel Feed</h3>
          <div className="space-y-4">
            {sentMessages.map(msg => (
              <div key={msg.id} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-xs">
                <div className="flex justify-between mb-2"><span className="font-bold text-blue-600">{msg.type}</span><span className="text-gray-400">{msg.timestamp}</span></div>
                <p className="font-semibold">{msg.recipient}</p>
                <p className="text-gray-500 italic mt-1">"{msg.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const VisitorsView = () => {
    const [subTab, setSubTab] = useState<'All' | 'Segments' | 'Leads'>('All');
    const isRestricted = userRole === 'Editor';

    const renderAllVisitors = () => (
      <div className="glass rounded-3xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input type="text" placeholder="Search visitors..." className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none" />
              <svg className="w-4 h-4 absolute right-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          <div className="flex space-x-2">
            <button disabled={isRestricted} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 transition-all ${isRestricted ? 'bg-gray-100 text-gray-400' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>
        <table className="w-full text-left">
          <thead><tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider"><th className="px-6 py-4">Visitor Name / ID</th><th className="px-6 py-4">Last Seen</th><th className="px-6 py-4">Segment</th><th className="px-6 py-4">Source</th><th className="px-6 py-4">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {visitors.map(v => (
              <tr key={v.id} className="hover:bg-gray-50 group">
                <td className="px-6 py-4"><p className="font-bold text-gray-900">{v.name}</p><p className="text-[10px] text-gray-400">{v.id}</p></td>
                <td className="px-6 py-4 text-sm text-gray-600">{v.lastSeen}</td>
                <td className="px-6 py-4">
                  {v.segmentId ? (
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${segments.find(s => s.id === v.segmentId)?.color}`}>
                      {segments.find(s => s.id === v.segmentId)?.name}
                    </span>
                  ) : <span className="text-[10px] text-gray-300">Unsegmented</span>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{v.source}</td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isRestricted && <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg" onClick={() => setVisitors(prev => prev.filter(vis => vis.id !== v.id))}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    const renderSegments = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {segments.map(seg => (
          <div key={seg.id} className="glass p-6 rounded-3xl border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-xl ${seg.color}`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <span className="text-2xl font-black text-gray-200">{seg.visitorCount}</span>
            </div>
            <h4 className="font-bold text-gray-900 text-lg mb-1">{seg.name}</h4>
            <p className="text-sm text-gray-500 mb-4">{seg.description}</p>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Active Filter</p>
              <code className="text-xs text-blue-600">{seg.criteria}</code>
            </div>
          </div>
        ))}
      </div>
    );

    const renderLeads = () => (
      <div className="glass rounded-3xl border border-gray-100 overflow-hidden">
        <div className="p-6 bg-blue-600 text-white flex items-center justify-between">
          <div><h3 className="text-xl font-bold">Leads Pipeline</h3><p className="text-xs opacity-80">Converted by Basma from active sessions.</p></div>
        </div>
        <table className="w-full text-left">
          <thead><tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider"><th className="px-6 py-4">Lead Contact</th><th className="px-6 py-4">Score</th><th className="px-6 py-4">Phone</th><th className="px-6 py-4">Created</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {leads.length > 0 ? leads.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-6 py-4"><p className="font-bold text-gray-900">{l.name}</p><p className="text-xs text-gray-400">{l.email}</p></td>
                <td className="px-6 py-4"><span className="text-xs font-bold text-blue-600">{l.score}%</span></td>
                <td className="px-6 py-4 text-sm text-gray-600">{l.phone}</td>
                <td className="px-6 py-4 text-xs text-gray-400">{new Date(l.createdAt).toLocaleDateString()}</td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="py-24 text-center text-gray-400 italic">No leads captured yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl w-fit">
          {(['All', 'Segments', 'Leads'] as const).map(t => (
            <button key={t} onClick={() => setSubTab(t)} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${subTab === t ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'All' ? 'All Visitors' : t === 'Leads' ? 'All Leads' : 'Segments'}
            </button>
          ))}
        </div>
        {subTab === 'All' && renderAllVisitors()}
        {subTab === 'Segments' && renderSegments()}
        {subTab === 'Leads' && renderLeads()}
      </div>
    );
  };

  const SettingsView = () => {
    const [subTab, setSubTab] = useState<'Attributes' | 'Entities'>('Attributes');
    const [newItemName, setNewItemName] = useState('');

    const addAttribute = () => {
      if (!newItemName) return;
      const newAttr: Attribute = {
        id: Math.random().toString(36).substr(2, 9),
        key: newItemName.toLowerCase().replace(/\s+/g, '_'),
        type: 'text',
        description: 'Custom added attribute',
        defaultValue: ''
      };
      setAttributes([...attributes, newAttr]);
      setNewItemName('');
    };

    const addEntity = () => {
      if (!newItemName) return;
      const newEnt: Entity = {
        id: Math.random().toString(36).substr(2, 9),
        name: newItemName,
        synonyms: [],
        description: 'New knowledge entity'
      };
      setEntities([...entities, newEnt]);
      setNewItemName('');
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="glass p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Visual Builder: Data & Knowledge</h3>
          <p className="text-gray-500 mb-8">Manage how Basma identifies entities and tracks custom visitor attributes.</p>

          <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl w-fit mb-8">
            {(['Attributes', 'Entities'] as const).map(t => (
              <button key={t} onClick={() => setSubTab(t)} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${subTab === t ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {subTab === 'Attributes' ? (
                attributes.map(attr => (
                  <div key={attr.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between group hover:border-blue-200 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">@</div>
                      <div>
                        <p className="font-bold text-gray-900">{attr.key}</p>
                        <p className="text-xs text-gray-400">{attr.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-[10px] font-bold uppercase px-2 py-1 bg-gray-100 rounded-lg text-gray-500">{attr.type}</span>
                      <button onClick={() => setAttributes(attributes.filter(a => a.id !== attr.id))} className="text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                entities.map(ent => (
                  <div key={ent.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between group hover:border-blue-200 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold">{'{}'}</div>
                      <div>
                        <p className="font-bold text-gray-900">{ent.name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ent.synonyms.map(s => <span key={s} className="text-[9px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded border border-gray-100">{s}</span>)}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setEntities(entities.filter(e => e.id !== ent.id))} className="text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="glass p-6 rounded-3xl border border-blue-50 h-fit sticky top-8">
              <h4 className="font-bold text-gray-900 mb-4">Add {subTab === 'Attributes' ? 'Attribute' : 'Entity'}</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Name</label>
                  <input 
                    type="text" 
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={subTab === 'Attributes' ? "e.g. user_plan" : "e.g. Product_Name"}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <button 
                  onClick={subTab === 'Attributes' ? addAttribute : addEntity}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                >
                  Create New {subTab === 'Attributes' ? 'Attribute' : 'Entity'}
                </button>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-xs text-blue-700 leading-relaxed">
                    {subTab === 'Attributes' ? 
                      "Attributes help you track persistent data about your visitors across sessions." :
                      "Entities represent specific terminology Basma should know to extract structured data."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const IntegrationsView = () => {
    const [copied, setCopied] = useState(false);
    const scriptSnippet = `<!-- Basma AI Call Widget -->\n<script src="https://basma.brain-sait.ai/widget.js" async></script>`.trim();
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="glass p-8 rounded-3xl border border-blue-100 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Integrate Basma into Your Sites</h3>
          <p className="text-gray-600 mb-8">Add a professional AI voice secretary to your web properties. Copy the code below.</p>
          <div className="relative group">
            <button onClick={() => { navigator.clipboard.writeText(scriptSnippet); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95">{copied ? 'Copied!' : 'Copy Snippet'}</button>
            <pre className="bg-slate-900 text-slate-300 p-6 rounded-3xl overflow-x-auto text-sm font-mono border-4 border-slate-800">{scriptSnippet}</pre>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      <aside className="w-full md:w-64 glass border-r border-gray-200 flex flex-col p-6 z-20">
        <div className="flex items-center space-x-3 mb-12 cursor-pointer" onClick={() => setActiveTab('Dashboard')}>
          <div className="bg-blue-600 p-2 rounded-xl text-white">{ICON_BASMA}</div>
          <div><h1 className="text-xl font-bold text-gray-900 leading-tight">BrainSAIT</h1><p className="text-xs text-blue-600 font-semibold tracking-wider uppercase">AI Secretary</p></div>
        </div>
        <nav className="flex-1 space-y-2">
          {['Dashboard', 'Calls', 'Appointments', 'Integrations', 'Visitors', 'Settings'].map((item) => (
            <button key={item} onClick={() => setActiveTab(item)} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === item ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>{item}</button>
          ))}
        </nav>
        <div className="mt-auto p-4 bg-blue-600 rounded-2xl text-white relative overflow-hidden shadow-lg"><p className="text-xs opacity-80 mb-1">Active Alerts</p><p className="text-xl font-bold">{activeRemindersCount} Actions</p><div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8" /></div>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-32">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div><h2 className="text-2xl font-bold text-gray-900">{activeTab}</h2><p className="text-gray-500">{activeTab === 'Visitors' ? 'Group visitors, convert leads, and personalize chats.' : 'System fully operational and HIPAA compliant.'}</p></div>
          <div className="text-right"><p className="text-sm font-semibold">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p><p className="text-xs text-gray-500">Riyadh, Saudi Arabia (UTC+3)</p></div>
        </header>
        {activeTab === 'Dashboard' && <DashboardView />}
        {activeTab === 'Integrations' && <IntegrationsView />}
        {activeTab === 'Visitors' && <VisitorsView />}
        {activeTab === 'Settings' && <SettingsView />}
        {['Calls', 'Appointments'].includes(activeTab) && (
          <div className="flex flex-col items-center justify-center h-96 text-gray-400">
            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="text-lg">Module "{activeTab}" is loading...</p>
          </div>
        )}
        {callStatus !== CallStatus.INACTIVE && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-xl z-40 flex flex-col items-center justify-center p-8 text-center transition-all animate-in fade-in zoom-in duration-500">
            <div className="w-64 h-64 relative mb-8"><div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" /><div className="absolute inset-4 bg-blue-600/30 rounded-full animate-pulse" /><div className="absolute inset-8 glass shadow-2xl rounded-full flex items-center justify-center border border-white/50"><div className="text-blue-600 scale-150 transition-transform animate-bounce">{ICON_BASMA}</div></div></div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Basma is Active</h2>
            <p className="text-xl text-gray-600 mb-12 max-w-lg">{callStatus === CallStatus.CONNECTING ? "Connecting to BrainSAIT..." : "Analyzing Visitor Data in Real-time"}</p>
            <VoicePulse isActive={callStatus === CallStatus.ACTIVE} color="bg-blue-600" />
            <div className="mt-12 flex space-x-4">
              <div className="glass px-6 py-3 rounded-2xl flex items-center space-x-3"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-sm font-semibold">Lead Scoring Active</span></div>
              <div className="glass px-6 py-3 rounded-2xl flex items-center space-x-3"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-sm font-semibold">Bilingual Processing</span></div>
            </div>
          </div>
        )}
      </main>
      <CallControl status={callStatus} onStart={startCall} onEnd={endCall} />
    </div>
  );
}