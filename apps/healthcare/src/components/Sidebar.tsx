import { useState } from 'react'

export function Sidebar() {
  const [expanded, setExpanded] = useState(true)

  const filters = [
    {
      title: 'Provider Type',
      options: ['Physician', 'Specialist', 'Nurse Practitioner', 'Therapist']
    },
    {
      title: 'Specialty',
      options: ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology']
    },
    {
      title: 'Location',
      options: ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina']
    },
    {
      title: 'Availability',
      options: ['Available Today', 'This Week', 'Next Week']
    },
    {
      title: 'Insurance',
      options: ['Bupa', 'Tawuniya', 'Medgulf', 'Salama']
    }
  ]

  return (
    <aside className={`bg-surface-dark border-r border-border transition-all duration-300 ${expanded ? 'w-72' : 'w-0'} overflow-hidden shrink-0`}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Filters</h2>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-text-secondary hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">
              {expanded ? 'chevron_left' : 'chevron_right'}
            </span>
          </button>
        </div>

        {filters.map((filter) => (
          <div key={filter.title} className="space-y-3">
            <h3 className="text-text-secondary text-xs font-bold uppercase tracking-wider">
              {filter.title}
            </h3>
            <div className="space-y-2">
              {filter.options.map((option) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-border bg-surface-dark-lighter checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  />
                  <span className="text-white text-sm group-hover:text-primary transition-colors">
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 space-y-2">
          <button className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-lg transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95">
            Apply Filters
          </button>
          <button className="w-full py-2.5 px-4 bg-surface-dark-lighter hover:bg-muted text-white font-medium rounded-lg transition-colors">
            Reset All
          </button>
        </div>
      </div>
    </aside>
  )
}
