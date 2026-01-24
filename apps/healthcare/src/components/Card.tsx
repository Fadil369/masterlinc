import { SearchResult } from '../types'

interface CardProps {
  data: SearchResult
}

export function Card({ data }: CardProps) {
  if (data.type === 'provider') {
    return (
      <div className="group bg-surface-dark rounded-xl border border-border hover:border-primary/50 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.02] cursor-pointer">
        <div className="flex gap-4">
          <img 
            src={data.imageUrl} 
            alt={data.name}
            className="w-20 h-20 rounded-xl object-cover border-2 border-border group-hover:border-primary/50 transition-colors"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-lg group-hover:text-primary transition-colors truncate">
                  {data.name}
                </h3>
                <p className="text-text-secondary text-sm">{data.title}</p>
              </div>
              {data.available !== undefined && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                  data.available 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  {data.available ? 'Available' : 'Busy'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-yellow-400 text-[18px]">star</span>
                <span className="text-white font-bold text-sm">{data.rating}</span>
              </div>
              <span className="text-text-secondary">•</span>
              <span className="text-text-secondary text-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                {data.location}
              </span>
            </div>

            {data.languages && data.languages.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-text-secondary text-[16px]">translate</span>
                <span className="text-text-secondary text-sm">{data.languages.join(', ')}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {data.tags.map((tag) => (
                <span 
                  key={tag}
                  className="px-2.5 py-1 bg-surface-dark-lighter text-primary text-xs font-medium rounded-md border border-primary/20"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <button className="flex-1 py-2 px-4 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-lg transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 text-sm">
                Book Appointment
              </button>
              <button className="py-2 px-4 bg-surface-dark-lighter hover:bg-muted text-white font-medium rounded-lg transition-colors text-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">info</span>
                Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group bg-surface-dark rounded-xl border border-border hover:border-primary/50 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.02] cursor-pointer">
      <div className="flex gap-4">
        <img 
          src={data.imageUrl} 
          alt={data.name}
          className="w-24 h-24 rounded-xl object-cover border-2 border-border group-hover:border-primary/50 transition-colors"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-lg group-hover:text-primary transition-colors truncate">
                {data.name}
              </h3>
              <p className="text-text-secondary text-sm">{data.description}</p>
            </div>
            {data.status && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${data.statusColor} text-white border border-white/20`}>
                {data.status}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-yellow-400 text-[18px]">star</span>
              <span className="text-white font-bold text-sm">{data.rating}</span>
            </div>
            <span className="text-text-secondary">•</span>
            <span className="text-text-secondary text-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              {data.address}
            </span>
          </div>

          {data.accreditation && (
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-[16px]">verified</span>
              <span className="text-text-secondary text-sm">{data.accreditation}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {data.tags.map((tag) => (
              <span 
                key={tag}
                className="px-2.5 py-1 bg-surface-dark-lighter text-primary text-xs font-medium rounded-md border border-primary/20"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <button className="flex-1 py-2 px-4 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-lg transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 text-sm">
              View Details
            </button>
            <button className="py-2 px-4 bg-surface-dark-lighter hover:bg-muted text-white font-medium rounded-lg transition-colors text-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">map</span>
              Directions
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
