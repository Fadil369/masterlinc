import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { Card } from './components/Card'
import { MapView } from './components/MapView'
import { AIAssistant } from './components/AIAssistant'
import { NotificationCenter } from './components/NotificationCenter'
import { NotificationDemo } from './components/NotificationDemo'
import { SearchResult, Notification } from './types'
import { useRealtimeNotifications } from './hooks/use-realtime-notifications'
import { NotificationProvider, useNotificationContext } from './contexts/NotificationContext'
import { Toaster } from './components/ui/sonner'
import { Conversation } from './types'

import { LiveFacilitiesMap } from './components/ecosystem/LiveFacilitiesMap'
import { VoiceAgent } from './components/ecosystem/VoiceAgent'
import { Appointments } from './components/ecosystem/Appointments'
import { DirectMessages } from './components/ecosystem/DirectMessages'
import { PatientIntake } from './components/ecosystem/PatientIntake'
import { DoctorDashboard } from './components/ecosystem/DoctorDashboard'
import { CDIModule } from './components/ecosystem/CDIModule'
import { RCMModule } from './components/ecosystem/RCMModule'
import { CodingModule } from './components/ecosystem/CodingModule'

const mockResults: SearchResult[] = [
  {
    id: '1',
    type: 'provider',
    name: 'Dr. Sarah Al-Faisal',
    title: 'Consultant Cardiologist',
    rating: 4.9,
    location: 'Kingdom Hospital, Riyadh',
    languages: ['English', 'Arabic'],
    tags: ['New Patients', 'Telehealth'],
    imageUrl: 'https://picsum.photos/100/100',
    available: true
  },
  {
    id: '2',
    type: 'facility',
    name: 'Kingdom Hospital',
    description: 'Multi-Specialty Hospital',
    rating: 4.7,
    address: 'King Fahd Road, Riyadh 11564',
    accreditation: 'JCI Accredited',
    tags: ['Emergency', 'ICU', 'Radiology'],
    imageUrl: 'https://picsum.photos/101/101',
    status: '24/7 OPEN',
    statusColor: 'bg-blue-500'
  },
  {
    id: '3',
    type: 'provider',
    name: 'Dr. Ahmed Yassin',
    title: 'Neurology Specialist',
    rating: 4.8,
    location: 'German Hospital, Jeddah',
    languages: ['English', 'Arabic', 'French'],
    tags: ['Pediatric Neuro', 'EEG'],
    imageUrl: 'https://picsum.photos/102/102',
    available: false
  },
  {
    id: '4',
    type: 'facility',
    name: 'Al-Amal Clinic',
    description: 'Family Medicine Center',
    rating: 4.5,
    address: 'Olaya Street, Riyadh',
    accreditation: 'Bupa, Tawuniya Accepted',
    tags: ['Vaccinations', 'Checkups'],
    imageUrl: 'https://picsum.photos/103/103',
    status: 'CLOSING SOON',
    statusColor: 'bg-orange-500'
  }
]

type View = 'directory' | 'live' | 'voice' | 'appointments' | 'messages' | 'intake' | 'doctor' | 'cdi' | 'rcm' | 'coding'

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('directory')
  const [directoryMode, setDirectoryMode] = useState<'list' | 'map'>('list')
  const [conversations] = useState<Conversation[]>([])
  const { notifications } = useNotificationContext()
  
  useRealtimeNotifications(true)

  const handleNotificationNavigate = (view: string, metadata?: Notification['metadata']) => {
    setCurrentView(view as View)
  }

  const appointmentNotifications = notifications.filter(n => n.type === 'appointment' && !n.read).length
  const messageCount = conversations?.reduce((sum, conv) => sum + conv.unreadCount, 0) || 0

  const renderContent = () => {
      let content
      switch(currentView) {
          case 'live': content = <LiveFacilitiesMap />; break
          case 'voice': content = <VoiceAgent />; break
          case 'appointments': content = <Appointments />; break
          case 'messages': content = <DirectMessages />; break
          case 'intake': content = <PatientIntake />; break
          case 'doctor': content = <DoctorDashboard />; break
          case 'cdi': content = <CDIModule />; break
          case 'rcm': content = <RCMModule />; break
          case 'coding': content = <CodingModule />; break
          default: content = (
            <div className="flex flex-1 overflow-hidden relative h-[calc(100vh-6rem)]">
                <Sidebar />
                <main className="flex-1 flex flex-col overflow-y-auto w-full scroll-smooth">
                <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
                    <div className="mb-8 space-y-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-white text-3xl font-black leading-tight tracking-[-0.033em]">Directory Search</h1>
                        <p className="text-text-secondary text-base">Find healthcare providers and facilities across the Kingdom</p>
                    </div>

                    <div className="grid gap-4 lg:flex lg:items-end">
                        <div className="flex-1">
                        <label className="block text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wider">Search</label>
                        <div className="relative h-12 w-full flex items-center rounded-xl bg-surface-dark-lighter shadow-sm border border-transparent focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:shadow-[0_0_15px_rgba(19,236,236,0.15)] transition-all duration-300 group">
                            <div className="flex items-center justify-center px-4 text-text-secondary group-focus-within:text-primary transition-colors">
                            <span className="material-symbols-outlined">search</span>
                            </div>
                            <input className="w-full h-full bg-transparent border-none text-white placeholder-text-secondary/50 focus:ring-0 text-base" placeholder="Search by name, NPI, facility, or specialty..." defaultValue="Cardiology" />
                            <div className="flex items-center pr-2 gap-2">
                                <button className="hidden sm:block bg-surface-dark hover:bg-black/20 text-text-secondary hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors active:scale-95">Clear</button>
                                <button className="hidden sm:block bg-primary hover:bg-primary-hover active:scale-95 text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-200">Search</button>
                                <button className="sm:hidden bg-primary hover:bg-primary-hover active:scale-95 text-primary-foreground p-2 rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-200 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-text-secondary mr-2">Active Filters:</span>
                        <div className="flex h-8 items-center gap-2 rounded-full bg-surface-dark-lighter border border-surface-dark-lighter hover:border-primary/50 px-3 text-sm text-white cursor-pointer transition-colors active:scale-95 select-none">
                        <span>Neurology</span>
                        <button className="flex items-center justify-center text-text-secondary hover:text-white">
                            <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                        </div>
                        <div className="flex h-8 items-center gap-2 rounded-full bg-surface-dark-lighter border border-surface-dark-lighter hover:border-primary/50 px-3 text-sm text-white cursor-pointer transition-colors active:scale-95 select-none">
                        <span>Riyadh</span>
                        <button className="flex items-center justify-center text-text-secondary hover:text-white">
                            <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                        </div>
                        <button className="text-sm text-primary hover:text-white hover:underline ml-2 transition-colors">Clear all</button>
                    </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-surface-dark-lighter gap-4">
                    <div className="text-white font-medium">
                        <span className="text-2xl font-bold text-white">124</span> <span className="text-text-secondary text-lg">Results found</span>
                    </div>
                    <div className="bg-surface-dark-lighter p-1 rounded-lg inline-flex shadow-inner w-full sm:w-auto">
                        <button 
                        onClick={() => setDirectoryMode('list')}
                        className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 font-bold text-sm ${directoryMode === 'list' ? 'bg-background-dark shadow-md text-primary transform scale-100' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}>
                        <span className="material-symbols-outlined text-[20px]">list</span> List View
                        </button>
                        <button 
                        onClick={() => setDirectoryMode('map')}
                        className={`flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 font-medium text-sm ${directoryMode === 'map' ? 'bg-background-dark shadow-md text-primary transform scale-100' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}>
                        <span className="material-symbols-outlined text-[20px]">map</span> Map View
                        </button>
                    </div>
                    </div>

                    {directoryMode === 'list' ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-10">
                        {mockResults.map(item => (
                        <Card key={item.id} data={item} />
                        ))}
                    </div>
                    ) : (
                    <div className="pb-10">
                        <MapView results={mockResults} />
                    </div>
                    )}
                </div>
                </main>
                <AIAssistant />
            </div>
          )
      }

      return (
        <div className="h-full w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out" key={currentView}>
            {content}
        </div>
      )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark overflow-hidden">
      <Toaster position="top-right" expand={true} richColors closeButton />
      <nav className="h-12 bg-[#0f1a1a] border-b border-[#234848] flex items-center px-4 justify-between shrink-0 z-50 shadow-md">
          <span className="text-[#92c9c9] text-xs font-mono font-bold uppercase tracking-wider hidden sm:block">BrainSAIT Ecosystem Demo</span>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1 sm:flex-none">
              {[
                  { id: 'directory', label: 'Directory', icon: 'folder_shared', badge: 0 },
                  { id: 'live', label: 'Live Map', icon: 'radar', badge: 0 },
                  { id: 'voice', label: 'Voice Agent', icon: 'graphic_eq', badge: 0 },
                  { id: 'appointments', label: 'Appointments', icon: 'calendar_month', badge: appointmentNotifications },
                  { id: 'messages', label: 'Messages', icon: 'chat', badge: messageCount },
                  { id: 'intake', label: 'Intake', icon: 'content_paste', badge: 0 },
                  { id: 'doctor', label: 'Provider', icon: 'stethoscope', badge: 0 }
              ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id as View)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 border ${currentView === item.id ? 'bg-[#13ecec] border-[#13ecec] text-[#112222] shadow-[0_0_15px_rgba(19,236,236,0.3)] scale-105' : 'border-transparent text-gray-400 hover:text-white hover:bg-[#234848] hover:border-[#234848]/50'}`}
                  >
                      <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                      <span className="whitespace-nowrap">{item.label}</span>
                      {item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-lg">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                  </button>
              ))}
          </div>
          <div className="flex items-center gap-2 ml-2">
            <NotificationCenter onNavigate={handleNotificationNavigate} />
          </div>
      </nav>

      {['cdi', 'rcm', 'coding'].includes(currentView) ? (
          <>
            <Header currentView={currentView} onNavigate={(v) => setCurrentView(v as View)} />
            {renderContent()}
          </>
      ) : currentView === 'directory' ? (
          <>
            <Header currentView={currentView} onNavigate={(v) => setCurrentView(v as View)} />
            {renderContent()}
          </>
      ) : (
          renderContent()
      )}
      <NotificationDemo />
    </div>
  )
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  )
}

export default App
