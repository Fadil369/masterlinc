interface HeaderProps {
  currentView: string
  onNavigate: (view: string) => void
}

export function Header({ currentView, onNavigate }: HeaderProps) {
  return (
    <header className="h-16 bg-surface-dark border-b border-border flex items-center justify-between px-6 shrink-0 shadow-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-primary-foreground text-[24px]">
              neurology
            </span>
          </div>
          <div>
            <h1 className="text-white font-bold text-xl tracking-tight">BrainSAIT</h1>
            <p className="text-text-secondary text-xs">Healthcare Ecosystem</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-dark-lighter hover:bg-muted text-white transition-colors">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="hidden sm:inline text-sm font-medium">Notifications</span>
          <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            3
          </span>
        </button>

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <p className="text-white text-sm font-medium">Dr. Ahmad Al-Rashid</p>
            <p className="text-text-secondary text-xs">Administrator</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold shadow-lg">
            AA
          </div>
        </div>
      </div>
    </header>
  )
}
