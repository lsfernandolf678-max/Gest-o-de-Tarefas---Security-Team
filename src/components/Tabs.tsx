/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BarChart3, HelpCircle, Table, Shield, MessageSquare } from 'lucide-react';
import { SheetTab, Task } from '../types';

interface TabsProps {
  tabs: SheetTab[];
  activeTab: 'tasks' | 'dashboard' | 'help' | 'users' | 'chat';
  onTabChange: (tabId: 'tasks' | 'dashboard' | 'help' | 'users' | 'chat') => void;
  tasks: Task[];
}

export default function Tabs({
  tabs,
  activeTab,
  onTabChange,
  tasks
}: TabsProps) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Concluído').length;
  const avgProgress = total 
    ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / total) 
    : 0;

  return (
    <div id="excel-bottom-tabs-bar" className="bg-slate-100 border-t border-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between h-auto sm:h-10 text-xs text-slate-700 select-none">
      {/* Bottom tabs on the left */}
      <div className="flex items-center overflow-x-auto shrink-0 bg-slate-200">
        {/* Navigation spacer */}
        <div className="px-2 font-mono text-[10px] text-slate-400 font-bold border-r border-slate-300 h-full flex items-center shrink-0">
          ◄ ◄ 📑 ► ►
        </div>

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 sm:py-0 sm:h-10 border-r border-slate-300 font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive 
                  ? 'bg-white text-emerald-800 font-bold border-t-2 border-t-emerald-700 shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.id === 'tasks' ? (
                <Table className="w-3.5 h-3.5 text-emerald-700" />
              ) : tab.id === 'dashboard' ? (
                <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
              ) : tab.id === 'users' ? (
                <Shield className="w-3.5 h-3.5 text-blue-700 fill-blue-100" />
              ) : tab.id === 'chat' ? (
                <MessageSquare className="w-3.5 h-3.5 text-violet-700 fill-violet-50" />
              ) : (
                <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Stats indicators on the right (Excel Status Bar style) */}
      <div className="flex items-center space-x-4 px-4 py-2 sm:py-0 text-[11px] text-slate-500 font-mono overflow-x-auto justify-end bg-slate-100 border-t border-slate-200 sm:border-t-0 flex-1">
        <div className="flex items-center space-x-1.5 whitespace-nowrap">
          <span className="text-slate-400">CONTAGEM:</span>
          <span className="font-bold text-slate-800">{total}</span>
        </div>
        <div className="h-3 w-[1px] bg-slate-300 hidden xs:block" />
        <div className="flex items-center space-x-1.5 whitespace-nowrap hidden xs:flex">
          <span className="text-slate-400">MÉDIA DE PROGRESSO:</span>
          <span className="font-bold text-slate-800">{avgProgress}%</span>
        </div>
        <div className="h-3 w-[1px] bg-slate-300" />
        <div className="flex items-center space-x-1.5 whitespace-nowrap">
          <span className="text-slate-400">CONCLUÍDAS:</span>
          <span className="font-bold text-emerald-700">{completed}</span>
        </div>
        <div className="h-full px-2.5 bg-emerald-800 text-emerald-50 text-[10px] font-bold font-sans flex items-center tracking-wider ml-2 shadow-inner h-8 rounded shrink-0 hidden sm:flex">
          PRONTO
        </div>
      </div>
    </div>
  );
}
