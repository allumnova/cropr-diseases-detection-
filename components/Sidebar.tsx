'use client';

import React from 'react';
import {
  Activity,
  Camera,
  Cpu,
  Navigation,
  Sprout,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabId = 'overview' | 'vision' | 'mitigation' | 'electrical' | 'hardware';

interface SidebarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  deviceId: string;
  hardwareConnected: boolean;
}

const NAV_GROUPS: {
  label: string;
  items: { id: TabId; label: string; icon: React.ReactNode }[];
}[] = [
  {
    label: 'Monitoring',
    items: [
      { id: 'overview', label: 'Overview', icon: <Activity className="h-4 w-4" /> },
      { id: 'vision', label: 'AI Vision & Cam', icon: <Camera className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'mitigation', label: 'Mitigation & Rover', icon: <Navigation className="h-4 w-4" /> },
      { id: 'electrical', label: 'Electrical Power', icon: <Zap className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Engineering',
    items: [
      { id: 'hardware', label: 'Hardware & Docs', icon: <Cpu className="h-4 w-4" /> },
    ],
  },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  deviceId,
  hardwareConnected,
}: SidebarProps) {
  return (
    <aside className="no-print flex w-full shrink-0 flex-col justify-between border-b border-[#23252b] bg-[#0f1012] lg:w-56 lg:border-b-0 lg:border-r">
      <div>
        {/* Brand */}
        <div className="flex h-14 items-center gap-2.5 border-b border-[#23252b] px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
            <Sprout className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight text-zinc-100">
              AgroGuard
            </div>
            <div className="truncate text-[11px] text-zinc-500">HBTU EE · UPCST</div>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="flex flex-row gap-4 overflow-x-auto px-3 py-3 lg:flex-col lg:gap-5 lg:py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-row items-center gap-1 lg:flex-col lg:items-stretch">
              <div className="hidden px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500 lg:block">
                {group.label}
              </div>
              {group.items.map((item) => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={cn(
                      'flex items-center gap-2.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                      active
                        ? 'bg-[#1b1d22] text-zinc-100'
                        : 'text-zinc-400 hover:bg-[#17181c] hover:text-zinc-200'
                    )}
                  >
                    <span className={active ? 'text-emerald-400' : 'text-zinc-500'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Node Footer */}
      <div className="hidden border-t border-[#23252b] p-3.5 lg:block">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Node</span>
          <span className="font-mono text-[11px] text-zinc-300">{deviceId}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-xs">
          <span className="text-zinc-500">Link</span>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-300">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                hardwareConnected ? 'bg-emerald-400' : 'bg-zinc-500'
              )}
            />
            {hardwareConnected ? 'ESP32 Live' : 'Simulator'}
          </span>
        </div>
      </div>
    </aside>
  );
}
