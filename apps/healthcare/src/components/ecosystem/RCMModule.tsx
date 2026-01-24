export function RCMModule() {
  const claims = [
    {
      id: 'CLM-001',
      patient: 'Sarah Al-Qahtani',
      dos: 'Jan 10, 2024',
      amount: 2500,
      status: 'paid',
      payer: 'Bupa Arabia'
    },
    {
      id: 'CLM-002',
      patient: 'Mohammed Hassan',
      dos: 'Jan 11, 2024',
      amount: 1800,
      status: 'pending',
      payer: 'Tawuniya'
    },
    {
      id: 'CLM-003',
      patient: 'Layla Ibrahim',
      dos: 'Jan 12, 2024',
      amount: 3200,
      status: 'denied',
      payer: 'Medgulf',
      denialReason: 'Prior authorization required'
    }
  ]

  return (
    <div className="h-full bg-background-dark p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-3xl font-black leading-tight tracking-[-0.033em] mb-2">
              Revenue Cycle Management
            </h1>
            <p className="text-text-secondary text-base">
              Financial tracking and claims management dashboard
            </p>
          </div>
          
          <button className="px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-lg transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface-dark rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-400 text-[24px]">
                  payments
                </span>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                  Total Revenue
                </p>
                <p className="text-white text-2xl font-bold">SAR 245K</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-dark rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-400 text-[24px]">
                  pending
                </span>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                  Pending Claims
                </p>
                <p className="text-white text-2xl font-bold">SAR 89K</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-dark rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-400 text-[24px]">
                  cancel
                </span>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                  Denied Claims
                </p>
                <p className="text-white text-2xl font-bold">SAR 12K</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-dark rounded-xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[24px]">
                  percent
                </span>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                  Collection Rate
                </p>
                <p className="text-white text-2xl font-bold">94%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-surface-dark rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-white font-bold text-lg">Claims Overview</h2>
                <div className="flex gap-2">
                  <select className="px-3 py-2 bg-surface-dark-lighter border border-border rounded-lg text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
                    <option>All Statuses</option>
                    <option>Paid</option>
                    <option>Pending</option>
                    <option>Denied</option>
                  </select>
                  <select className="px-3 py-2 bg-surface-dark-lighter border border-border rounded-lg text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
                    <option>This Month</option>
                    <option>Last Month</option>
                    <option>Last Quarter</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-dark-lighter border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                        Claim ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                        Date of Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                        Payer
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
                    {claims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-surface-dark-lighter transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-primary font-bold text-sm">{claim.id}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-white font-medium text-sm">{claim.patient}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-text-secondary text-sm">{claim.dos}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-white font-bold text-sm">SAR {claim.amount.toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-text-secondary text-sm">{claim.payer}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            claim.status === 'paid'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : claim.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button className="text-primary hover:text-white text-sm font-medium transition-colors">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-surface-dark rounded-xl border border-border p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">warning</span>
                Denial Management
              </h3>

              <div className="space-y-3">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 font-bold text-sm mb-1">Prior Auth Required</p>
                  <p className="text-red-300 text-xs mb-2">3 claims | SAR 8,500</p>
                  <button className="text-primary hover:text-white text-xs font-medium transition-colors">
                    Resubmit →
                  </button>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 font-bold text-sm mb-1">Missing Information</p>
                  <p className="text-red-300 text-xs mb-2">2 claims | SAR 2,800</p>
                  <button className="text-primary hover:text-white text-xs font-medium transition-colors">
                    Review →
                  </button>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 font-bold text-sm mb-1">Not Covered</p>
                  <p className="text-red-300 text-xs mb-2">1 claim | SAR 700</p>
                  <button className="text-primary hover:text-white text-xs font-medium transition-colors">
                    Appeal →
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-surface-dark rounded-xl border border-border p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
                Aging Report
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">0-30 days</span>
                  <span className="text-white font-bold text-sm">SAR 45K</span>
                </div>
                <div className="h-2 bg-surface-dark-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all duration-500" style={{ width: '60%' }} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">31-60 days</span>
                  <span className="text-white font-bold text-sm">SAR 28K</span>
                </div>
                <div className="h-2 bg-surface-dark-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: '37%' }} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">61-90 days</span>
                  <span className="text-white font-bold text-sm">SAR 12K</span>
                </div>
                <div className="h-2 bg-surface-dark-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: '16%' }} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">90+ days</span>
                  <span className="text-white font-bold text-sm">SAR 4K</span>
                </div>
                <div className="h-2 bg-surface-dark-lighter rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 transition-all duration-500" style={{ width: '5%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
