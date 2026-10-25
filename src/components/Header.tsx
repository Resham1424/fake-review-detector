import React from 'react';
import {
  FileSearch,
  ListFilter,
  Fingerprint,
  Crosshair,
  Scale,
  Database,
  Terminal,
  CircleCheck
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'consumer', label: 'Review audit', icon: FileSearch },
    { id: 'moderator', label: 'Triage queue', icon: ListFilter },
    { id: 'reviewer', label: 'Subject dossier', icon: Fingerprint },
    { id: 'adversarial', label: 'Stress testing', icon: Crosshair },
    { id: 'benchmarks', label: 'Validation ledger', icon: Scale },
    { id: 'dataset', label: 'Test corpus', icon: Database },
    { id: 'api', label: 'API specification', icon: Terminal },
  ];

  return (
    <header className="border-b border-[#262f3d] bg-[#12161f] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Zone 1: Single Brand Element with Editorial Typography */}
          <div className="flex items-center gap-3">
            <span className="font-display font-semibold text-xl tracking-tight text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-none bg-amber-500 inline-block" aria-hidden="true" />
              VerityCheck
            </span>
            <span className="text-xs text-[#8b949e] hidden md:inline border-l border-[#262f3d] pl-3">
              Forensic review authenticity auditor
            </span>
          </div>

          {/* Zone 2: Clean Typography Navigation (No Pill Capsules) */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap rounded-sm ${
                    isActive
                      ? 'text-white border-b-2 border-amber-500 bg-[#161b22]'
                      : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#161b22]/50'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-amber-400' : 'text-[#8b949e]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
