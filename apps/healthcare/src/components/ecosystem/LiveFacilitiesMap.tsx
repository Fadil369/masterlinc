import { Facility } from '../../types'

const mockFacilities: Facility[] = [
  {
    id: '1',
    name: 'Kingdom Hospital',
    type: 'General Hospital',
    address: 'King Fahd Road, Riyadh',
    coordinates: { lat: 24.7136, lng: 46.6753 },
    status: 'operational',
    capacity: { total: 200, available: 45, occupied: 155 },
    services: ['Emergency', 'ICU', 'Surgery', 'Radiology'],
    waitTime: 15
  },
  {
    id: '2',
    name: 'Al-Amal Clinic',
    type: 'Outpatient Clinic',
    address: 'Olaya Street, Riyadh',
    coordinates: { lat: 24.6900, lng: 46.6850 },
    status: 'busy',
    capacity: { total: 50, available: 3, occupied: 47 },
    services: ['Primary Care', 'Vaccinations'],
    waitTime: 45
  },
  {
    id: '3',
    name: 'German Hospital',
    type: 'Specialty Hospital',
    address: 'Tahlia Street, Jeddah',
    coordinates: { lat: 21.5433, lng: 39.1728 },
    status: 'operational',
    capacity: { total: 150, available: 62, occupied: 88 },
    services: ['Cardiology', 'Neurology', 'Orthopedics'],
    waitTime: 20
  },
  {
    id: '4',
    name: 'Emergency Center',
    type: 'Emergency Care',
    address: 'King Abdullah Road, Riyadh',
    coordinates: { lat: 24.7500, lng: 46.7000 },
    status: 'critical',
    capacity: { total: 30, available: 1, occupied: 29 },
    services: ['Emergency', 'Trauma'],
    waitTime: 90
  }
]

export function LiveFacilitiesMap() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500'
      case 'busy': return 'bg-yellow-500'
      case 'critical': return 'bg-red-500'
      case 'closed': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational': return 'Operational'
      case 'busy': return 'Busy'
      case 'critical': return 'Critical'
      case 'closed': return 'Closed'
      default: return 'Unknown'
    }
  }

  return (
    <div className="h-full bg-background-dark p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-white text-3xl font-black leading-tight tracking-[-0.033em] mb-2">
            Live Facilities Map
          </h1>
          <p className="text-text-secondary text-base">
            Real-time facility status and capacity across the network
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface-dark rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-400 text-[24px]">
                  check_circle
                </span>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                  Operational
                </p>
                <p className="text-white text-2xl font-bold">2</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-dark rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-yellow-400 text-[24px]">
                  warning
                </span>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                  Busy
                </p>
                <p className="text-white text-2xl font-bold">1</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-dark rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-400 text-[24px]">
                  error
                </span>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                  Critical
                </p>
                <p className="text-white text-2xl font-bold">1</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-dark rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[24px]">
                  local_hospital
                </span>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wider font-bold">
                  Total Facilities
                </p>
                <p className="text-white text-2xl font-bold">{mockFacilities.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative w-full h-[500px] bg-surface-dark rounded-xl border border-border overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-surface-dark via-background-dark to-surface-dark">
            <svg className="w-full h-full" viewBox="0 0 1000 500">
              <defs>
                <pattern id="live-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(19, 236, 236, 0.05)" strokeWidth="1"/>
                </pattern>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <rect width="1000" height="500" fill="url(#live-grid)" />

              {mockFacilities.map((facility, index) => {
                const x = 150 + (index * 200)
                const y = 150 + (index % 2) * 150
                const statusColors = {
                  operational: '#22c55e',
                  busy: '#eab308',
                  critical: '#ef4444',
                  closed: '#6b7280'
                }
                
                return (
                  <g key={facility.id} className="cursor-pointer group">
                    <circle
                      cx={x}
                      cy={y}
                      r="40"
                      fill="rgba(19, 236, 236, 0.05)"
                      stroke={statusColors[facility.status]}
                      strokeWidth="3"
                      filter="url(#glow)"
                      className="transition-all duration-300 group-hover:r-50"
                    >
                      <animate
                        attributeName="r"
                        values="40;45;40"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx={x}
                      cy={y}
                      r="25"
                      fill={statusColors[facility.status]}
                      className="transition-all duration-300"
                    />
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="24"
                      className="pointer-events-none"
                    >
                      🏥
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="absolute top-4 right-4 bg-surface-dark/95 backdrop-blur border border-border rounded-xl p-4 space-y-3 shadow-xl max-w-xs">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">info</span>
              Live Status Legend
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-ping" />
                </div>
                <span className="text-text-secondary text-xs">Operational - Normal capacity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 animate-ping" />
                </div>
                <span className="text-text-secondary text-xs">Busy - Limited availability</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                </div>
                <span className="text-text-secondary text-xs">Critical - At capacity</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mockFacilities.map((facility) => (
            <div
              key={facility.id}
              className="bg-surface-dark rounded-xl border border-border p-5 hover:border-primary/50 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-1">{facility.name}</h3>
                  <p className="text-text-secondary text-sm">{facility.type}</p>
                  <p className="text-text-secondary text-sm flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    {facility.address}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(facility.status)} flex items-center gap-1`}>
                  <span className={`w-2 h-2 rounded-full bg-white animate-pulse`} />
                  {getStatusText(facility.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-surface-dark-lighter rounded-lg p-3">
                  <p className="text-text-secondary text-xs mb-1">Capacity</p>
                  <p className="text-white font-bold text-lg">
                    {facility.capacity.available}/{facility.capacity.total}
                  </p>
                  <div className="mt-2 h-2 bg-background-dark rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getStatusColor(facility.status)} transition-all duration-500`}
                      style={{ width: `${(facility.capacity.occupied / facility.capacity.total) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-surface-dark-lighter rounded-lg p-3">
                  <p className="text-text-secondary text-xs mb-1">Wait Time</p>
                  <p className="text-white font-bold text-lg">{facility.waitTime} min</p>
                  <p className="text-text-secondary text-xs mt-1">Average</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-text-secondary text-xs font-bold uppercase tracking-wider">
                  Available Services
                </p>
                <div className="flex flex-wrap gap-2">
                  {facility.services.map((service) => (
                    <span 
                      key={service}
                      className="px-2.5 py-1 bg-surface-dark-lighter text-primary text-xs font-medium rounded-md border border-primary/20"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
