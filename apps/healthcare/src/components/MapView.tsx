import { SearchResult } from '../types'

interface MapViewProps {
  results: SearchResult[]
}

export function MapView({ results }: MapViewProps) {
  return (
    <div className="relative w-full h-[600px] bg-surface-dark rounded-xl border border-border overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-surface-dark via-background-dark to-surface-dark">
        <svg className="w-full h-full" viewBox="0 0 800 600">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(19, 236, 236, 0.05)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="800" height="600" fill="url(#grid)" />
          
          <path
            d="M100,150 Q200,100 300,150 T500,150 L550,200 Q600,250 550,300 L500,400 Q450,450 400,400 L300,350 Q200,300 150,250 Z"
            fill="rgba(19, 236, 236, 0.03)"
            stroke="rgba(19, 236, 236, 0.1)"
            strokeWidth="2"
          />

          {results.map((result, index) => {
            const x = 150 + (index * 150) % 500
            const y = 200 + (index * 100) % 300
            const isProvider = result.type === 'provider'
            
            return (
              <g key={result.id} className="cursor-pointer group">
                <circle
                  cx={x}
                  cy={y}
                  r="30"
                  fill="rgba(19, 236, 236, 0.1)"
                  stroke="rgba(19, 236, 236, 0.5)"
                  strokeWidth="2"
                  className="transition-all duration-300 group-hover:fill-[rgba(19,236,236,0.2)] group-hover:r-35"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="20"
                  fill={isProvider ? 'oklch(0.87 0.15 195)' : 'oklch(0.70 0.15 250)'}
                  className="transition-all duration-300 group-hover:r-25"
                />
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="oklch(0.15 0.02 195)"
                  fontSize="20"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {isProvider ? '👨‍⚕️' : '🏥'}
                </text>
                
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <rect
                    x={x + 35}
                    y={y - 30}
                    width="180"
                    height="60"
                    rx="8"
                    fill="oklch(0.20 0.03 195)"
                    stroke="oklch(0.87 0.15 195)"
                    strokeWidth="1"
                  />
                  <text
                    x={x + 45}
                    y={y - 10}
                    fill="white"
                    fontSize="12"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {result.name.length > 20 ? result.name.slice(0, 20) + '...' : result.name}
                  </text>
                  <text
                    x={x + 45}
                    y={y + 10}
                    fill="oklch(0.65 0.03 195)"
                    fontSize="10"
                    className="pointer-events-none"
                  >
                    ⭐ {result.rating} • {result.type}
                  </text>
                </g>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="absolute top-4 right-4 bg-surface-dark border border-border rounded-lg p-4 space-y-3 shadow-xl">
        <h3 className="text-white font-bold text-sm">Map Legend</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary" />
            <span className="text-text-secondary text-xs">Providers ({results.filter(r => r.type === 'provider').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: 'oklch(0.70 0.15 250)' }} />
            <span className="text-text-secondary text-xs">Facilities ({results.filter(r => r.type === 'facility').length})</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 flex gap-2">
        <button className="px-4 py-2 bg-surface-dark border border-border rounded-lg text-white hover:bg-muted transition-colors text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">zoom_in</span>
          Zoom In
        </button>
        <button className="px-4 py-2 bg-surface-dark border border-border rounded-lg text-white hover:bg-muted transition-colors text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">zoom_out</span>
          Zoom Out
        </button>
        <button className="px-4 py-2 bg-surface-dark border border-border rounded-lg text-white hover:bg-muted transition-colors text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">my_location</span>
          Center
        </button>
      </div>
    </div>
  )
}
