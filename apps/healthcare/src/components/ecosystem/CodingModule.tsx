export function CodingModule() {
  const encounters = [
    {
      id: 'ENC-001',
      patient: 'Sarah Al-Qahtani',
      dos: 'Jan 12, 2024',
      provider: 'Dr. Ahmad Al-Rashid',
      encounterType: 'Inpatient',
      status: 'pending',
      suggestedCodes: ['I50.9', '99223']
    },
    {
      id: 'ENC-002',
      patient: 'Mohammed Hassan',
      dos: 'Jan 13, 2024',
      provider: 'Dr. Fatima Al-Zahrani',
      encounterType: 'Outpatient',
      status: 'in-progress',
      suggestedCodes: ['Z00.00', '99213']
    },
    {
      id: 'ENC-003',
      patient: 'Layla Ibrahim',
      dos: 'Jan 14, 2024',
      provider: 'Dr. Ahmad Al-Rashid',
      encounterType: 'Emergency',
      status: 'complete',
      suggestedCodes: ['R07.9', '99284']
    }
  ]

  return (
    <div className="h-full bg-background-dark p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-3xl font-black leading-tight tracking-[-0.033em] mb-2">
              Medical Coding
            </h1>
            <p className="text-text-secondary text-base">
              AI-assisted ICD-10 and CPT code assignment
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface-dark rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-yellow-400 text-[24px]">
                  pending_actions
                </span>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                  Pending Review
                </p>
                <p className="text-white text-2xl font-bold">
                  {encounters.filter(e => e.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-dark rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-400 text-[24px]">
                  rate_review
                </span>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                  In Progress
                </p>
                <p className="text-white text-2xl font-bold">
                  {encounters.filter(e => e.status === 'in-progress').length}
                </p>
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
                  Completed Today
                </p>
                <p className="text-white text-2xl font-bold">
                  {encounters.filter(e => e.status === 'complete').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-dark rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[24px]">
                  speed
                </span>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                  Avg Coding Time
                </p>
                <p className="text-white text-2xl font-bold">4.2m</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-dark rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">Coding Queue</h2>
            <div className="flex gap-2">
              <select className="px-3 py-2 bg-surface-dark-lighter border border-border rounded-lg text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
                <option>All Types</option>
                <option>Inpatient</option>
                <option>Outpatient</option>
                <option>Emergency</option>
              </select>
              <select className="px-3 py-2 bg-surface-dark-lighter border border-border rounded-lg text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
                <option>All Statuses</option>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Complete</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-dark-lighter border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Encounter ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Date of Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    AI Suggestions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {encounters.map((encounter) => (
                  <tr key={encounter.id} className="hover:bg-surface-dark-lighter transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-primary font-bold text-sm">{encounter.id}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-white font-medium text-sm">{encounter.patient}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-text-secondary text-sm">{encounter.dos}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-text-secondary text-sm">{encounter.provider}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-surface-dark-lighter text-primary text-xs font-medium rounded-md border border-primary/20">
                        {encounter.encounterType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {encounter.suggestedCodes.map((code, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-mono font-bold rounded">
                            {code}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        encounter.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : encounter.status === 'in-progress'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {encounter.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-lg transition-all duration-200 text-sm">
                        Code
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface-dark rounded-xl border border-border p-6">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              AI Code Suggestions
            </h3>

            <div className="space-y-4">
              <div className="bg-surface-dark-lighter rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-bold text-sm mb-1">Primary Diagnosis</p>
                    <p className="text-text-secondary text-xs">Based on clinical documentation</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-green-400 text-[16px]">check_circle</span>
                    <span className="text-green-400 text-xs font-bold">98% confident</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-primary/10 border border-primary/30 rounded">
                    <div>
                      <p className="text-primary font-mono font-bold text-sm">I50.9</p>
                      <p className="text-primary text-xs">Heart failure, unspecified</p>
                    </div>
                    <button className="px-3 py-1 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded text-xs transition-all">
                      Accept
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-surface-dark-lighter rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-bold text-sm mb-1">E/M Code</p>
                    <p className="text-text-secondary text-xs">Based on encounter complexity</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-yellow-400 text-[16px]">info</span>
                    <span className="text-yellow-400 text-xs font-bold">92% confident</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-primary/10 border border-primary/30 rounded">
                    <div>
                      <p className="text-primary font-mono font-bold text-sm">99223</p>
                      <p className="text-primary text-xs">Initial hospital care, high complexity</p>
                    </div>
                    <button className="px-3 py-1 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded text-xs transition-all">
                      Accept
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-400 text-[20px] shrink-0">lightbulb</span>
                  <div>
                    <p className="text-blue-400 font-bold text-sm mb-1">Coding Tip</p>
                    <p className="text-blue-300 text-xs">
                      Consider adding specificity codes for better reimbursement. Documentation supports more specific diagnosis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-dark rounded-xl border border-border p-6">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">trending_up</span>
              Coding Performance
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary text-sm">Coding Accuracy</span>
                  <span className="text-white font-bold text-sm">96%</span>
                </div>
                <div className="h-2 bg-surface-dark-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all duration-500" style={{ width: '96%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary text-sm">AI Suggestion Acceptance</span>
                  <span className="text-white font-bold text-sm">89%</span>
                </div>
                <div className="h-2 bg-surface-dark-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: '89%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary text-sm">Productivity (charts/hour)</span>
                  <span className="text-white font-bold text-sm">14.2</span>
                </div>
                <div className="h-2 bg-surface-dark-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: '85%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary text-sm">Query Rate</span>
                  <span className="text-white font-bold text-sm">3.2%</span>
                </div>
                <div className="h-2 bg-surface-dark-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: '15%' }} />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-text-secondary text-xs mb-3">Recent Activity</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-400">✓</span>
                    <span className="text-text-secondary">Coded 12 encounters today</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-400">✓</span>
                    <span className="text-text-secondary">98% accuracy this week</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-400">✓</span>
                    <span className="text-text-secondary">2 hours saved with AI assist</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
