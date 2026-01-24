export function DoctorDashboard() {
  const patients = [
    { id: '1', name: 'Sarah Al-Qahtani', time: '09:00 AM', reason: 'Follow-up', status: 'waiting' },
    { id: '2', name: 'Mohammed Hassan', time: '10:00 AM', reason: 'New Patient', status: 'in-room' },
    { id: '3', name: 'Layla Ibrahim', time: '11:00 AM', reason: 'Annual Check', status: 'scheduled' }
  ]

  const recentCharts = [
    { id: '1', patient: 'Ahmad Khalid', date: 'Jan 10, 2024', type: 'Progress Note' },
    { id: '2', patient: 'Nora Al-Tamimi', date: 'Jan 09, 2024', type: 'Consultation' },
    { id: '3', patient: 'Yousef Saleh', date: 'Jan 08, 2024', type: 'Follow-up' }
  ]

  return (
    <div className="h-full bg-background-dark p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-3xl font-black leading-tight tracking-[-0.033em] mb-2">
              Provider Dashboard
            </h1>
            <p className="text-text-secondary text-base">
              Welcome back, Dr. Ahmad Al-Rashid
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-surface-dark-lighter hover:bg-muted text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">schedule</span>
              My Schedule
            </button>
            <button className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-lg transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">edit_note</span>
              New Note
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface-dark rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-400 text-[24px]">
                  groups
                </span>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                  Today's Patients
                </p>
                <p className="text-white text-2xl font-bold">12</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-dark rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-400 text-[24px]">
                  task_alt
                </span>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                  Completed
                </p>
                <p className="text-white text-2xl font-bold">8</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-dark rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-yellow-400 text-[24px]">
                  pending_actions
                </span>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                  Pending Tasks
                </p>
                <p className="text-white text-2xl font-bold">5</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-dark rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[24px]">
                  description
                </span>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                  Charts to Sign
                </p>
                <p className="text-white text-2xl font-bold">3</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface-dark rounded-xl border border-border p-6">
              <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person_raised_hand</span>
                Patient Queue
              </h2>

              <div className="space-y-3">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    className="bg-surface-dark-lighter rounded-lg p-4 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-base">{patient.name}</h3>
                          <p className="text-text-secondary text-sm">{patient.reason}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-white font-medium text-sm">{patient.time}</p>
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            patient.status === 'waiting'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : patient.status === 'in-room'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {patient.status === 'waiting' ? 'Waiting' : patient.status === 'in-room' ? 'In Room' : 'Scheduled'}
                          </span>
                        </div>
                        <button className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-lg transition-all duration-200 text-sm">
                          Open Chart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-dark rounded-xl border border-border p-6">
              <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">lab_research</span>
                Clinical Decision Support
              </h2>

              <div className="space-y-3">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex gap-3">
                  <span className="material-symbols-outlined text-blue-400 text-[24px] shrink-0">info</span>
                  <div>
                    <p className="text-blue-400 font-bold text-sm mb-1">Drug Interaction Alert</p>
                    <p className="text-blue-300 text-sm">
                      Potential interaction detected between prescribed medications for Patient Sarah Al-Qahtani
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
                  <span className="material-symbols-outlined text-yellow-400 text-[24px] shrink-0">warning</span>
                  <div>
                    <p className="text-yellow-400 font-bold text-sm mb-1">Preventive Care Reminder</p>
                    <p className="text-yellow-300 text-sm">
                      3 patients due for annual wellness visits this month
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-surface-dark rounded-xl border border-border p-6">
              <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">history</span>
                Recent Charts
              </h2>

              <div className="space-y-3">
                {recentCharts.map((chart) => (
                  <div
                    key={chart.id}
                    className="bg-surface-dark-lighter rounded-lg p-3 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <h3 className="text-white font-bold text-sm mb-1">{chart.patient}</h3>
                    <p className="text-text-secondary text-xs mb-1">{chart.type}</p>
                    <p className="text-text-secondary text-xs">{chart.date}</p>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 py-2 text-primary hover:text-white text-sm font-medium transition-colors">
                View All Charts →
              </button>
            </div>

            <div className="bg-surface-dark rounded-xl border border-border p-6">
              <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">checklist</span>
                Tasks
              </h2>

              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-border bg-surface-dark-lighter checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  />
                  <span className="text-white text-sm group-hover:text-primary transition-colors">
                    Sign progress notes (3)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-border bg-surface-dark-lighter checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  />
                  <span className="text-white text-sm group-hover:text-primary transition-colors">
                    Review lab results (5)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-border bg-surface-dark-lighter checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  />
                  <span className="text-white text-sm group-hover:text-primary transition-colors">
                    Complete peer review
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked
                    className="w-4 h-4 rounded border-border bg-surface-dark-lighter checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  />
                  <span className="text-text-secondary text-sm line-through">
                    Submit timesheet
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
