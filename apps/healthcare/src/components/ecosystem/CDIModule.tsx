export function CDIModule() {
  const charts = [
    {
      id: '1',
      patient: 'Sarah Al-Qahtani',
      mrn: 'MRN-2024-001',
      admitDate: 'Jan 12, 2024',
      provider: 'Dr. Ahmad Al-Rashid',
      priority: 'high',
      gaps: 3,
      status: 'review'
    },
    {
      id: '2',
      patient: 'Mohammed Hassan',
      mrn: 'MRN-2024-002',
      admitDate: 'Jan 13, 2024',
      provider: 'Dr. Fatima Al-Zahrani',
      priority: 'medium',
      gaps: 1,
      status: 'query'
    },
    {
      id: '3',
      patient: 'Layla Ibrahim',
      mrn: 'MRN-2024-003',
      admitDate: 'Jan 14, 2024',
      provider: 'Dr. Ahmad Al-Rashid',
      priority: 'low',
      gaps: 0,
      status: 'complete'
    }
  ]

  return (
    <div className="h-full bg-background-dark p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-3xl font-black leading-tight tracking-[-0.033em] mb-2">
              Clinical Documentation Improvement
            </h1>
            <p className="text-text-secondary text-base">
              AI-powered documentation review and quality assurance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface-dark rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-400 text-[24px]">
                  priority_high
                </span>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                  High Priority
                </p>
                <p className="text-white text-2xl font-bold">
                  {charts.filter(c => c.priority === 'high').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-dark rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-yellow-400 text-[24px]">
                  pending
                </span>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                  Pending Review
                </p>
                <p className="text-white text-2xl font-bold">
                  {charts.filter(c => c.status === 'review').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-dark rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-400 text-[24px]">
                  help
                </span>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                  Query Sent
                </p>
                <p className="text-white text-2xl font-bold">
                  {charts.filter(c => c.status === 'query').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-dark rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-400 text-[24px]">
                  check_circle
                </span>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                  Completed
                </p>
                <p className="text-white text-2xl font-bold">
                  {charts.filter(c => c.status === 'complete').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-dark rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">Chart Review Queue</h2>
            <div className="flex gap-2">
              <select className="px-3 py-2 bg-surface-dark-lighter border border-border rounded-lg text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
                <option>All Priorities</option>
                <option>High Priority</option>
                <option>Medium Priority</option>
                <option>Low Priority</option>
              </select>
              <select className="px-3 py-2 bg-surface-dark-lighter border border-border rounded-lg text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
                <option>All Statuses</option>
                <option>Review</option>
                <option>Query Sent</option>
                <option>Complete</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-dark-lighter border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    MRN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Admit Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Doc Gaps
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
                {charts.map((chart) => (
                  <tr key={chart.id} className="hover:bg-surface-dark-lighter transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-white font-bold text-sm">{chart.patient}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-text-secondary text-sm">{chart.mrn}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-text-secondary text-sm">{chart.admitDate}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-text-secondary text-sm">{chart.provider}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        chart.priority === 'high'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : chart.priority === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {chart.priority.charAt(0).toUpperCase() + chart.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-bold text-sm ${chart.gaps > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {chart.gaps}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        chart.status === 'review'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : chart.status === 'query'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {chart.status.charAt(0).toUpperCase() + chart.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-lg transition-all duration-200 text-sm">
                        Review
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
              AI Documentation Insights
            </h3>

            <div className="space-y-3">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-yellow-400 text-[20px] shrink-0">warning</span>
                  <div>
                    <p className="text-yellow-400 font-bold text-sm mb-1">Missing Specificity</p>
                    <p className="text-yellow-300 text-sm mb-2">
                      "Heart failure" documented without type, severity, or acuity
                    </p>
                    <p className="text-yellow-300 text-xs">
                      <strong>Suggestion:</strong> Query for: Acute vs Chronic, Systolic vs Diastolic, NYHA Class
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-400 text-[20px] shrink-0">info</span>
                  <div>
                    <p className="text-blue-400 font-bold text-sm mb-1">Conflicting Documentation</p>
                    <p className="text-blue-300 text-sm mb-2">
                      Nursing notes indicate moderate respiratory distress, but physician assessment says "no acute distress"
                    </p>
                    <p className="text-blue-300 text-xs">
                      <strong>Suggestion:</strong> Clarify clinical status with provider
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-green-400 text-[20px] shrink-0">check_circle</span>
                  <div>
                    <p className="text-green-400 font-bold text-sm mb-1">Excellent Documentation</p>
                    <p className="text-green-300 text-sm">
                      Comprehensive, specific diagnosis with appropriate supporting clinical indicators
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-dark rounded-xl border border-border p-6">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">trending_up</span>
              Quality Metrics
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary text-sm">Query Response Rate</span>
                  <span className="text-white font-bold text-sm">92%</span>
                </div>
                <div className="h-2 bg-surface-dark-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all duration-500" style={{ width: '92%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary text-sm">Documentation Specificity</span>
                  <span className="text-white font-bold text-sm">87%</span>
                </div>
                <div className="h-2 bg-surface-dark-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: '87%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary text-sm">Case Mix Index Improvement</span>
                  <span className="text-white font-bold text-sm">+0.15</span>
                </div>
                <div className="h-2 bg-surface-dark-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: '75%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary text-sm">Average Query Turnaround</span>
                  <span className="text-white font-bold text-sm">1.2 days</span>
                </div>
                <div className="h-2 bg-surface-dark-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: '60%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
