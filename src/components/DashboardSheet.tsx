/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BarChart3, CheckSquare, Clock, AlertOctagon, TrendingUp, Users } from 'lucide-react';
import { Task } from '../types';

interface DashboardSheetProps {
  tasks: Task[];
}

export default function DashboardSheet({ tasks }: DashboardSheetProps) {
  // Calculations
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Concluído').length;
  const inProgress1 = tasks.filter(t => t.status === 'Em andamento - 1').length;
  const inProgress2 = tasks.filter(t => t.status === 'Em andamento - 2 (quase finalizado)').length;
  const started = tasks.filter(t => t.status === 'Iniciada').length;
  const notStarted = tasks.filter(t => t.status === 'Não iniciada').length;

  const avgProgress = total 
    ? Math.round(tasks.reduce((acc, t) => acc + (t.progress || 0), 0) / total) 
    : 0;

  const priorityHigh = tasks.filter(t => t.priority === 'Alta').length;
  const priorityMedium = tasks.filter(t => t.priority === 'Média').length;
  const priorityLow = tasks.filter(t => t.priority === 'Baixa').length;

  // Custom SVG donut chart calculations for Statuses
  const values = [completed, inProgress2, inProgress1, started, notStarted];
  const colors = ['#10b981', '#f59e0b', '#3b82f6', '#0ea5e9', '#94a3b8']; // emerald, amber, blue, sky, slate
  const labels = ['Concluído', 'Em andamento - 2 (quase finalizado)', 'Em andamento - 1', 'Iniciada', 'Não iniciada'];
  const totalVal = values.reduce((a, b) => a + b, 0);

  // Calculate donut slices
  let cumulativePercent = 0;
  const slices = values.map((val, idx) => {
    if (totalVal === 0) return null;
    const percent = val / totalVal;
    const strokeDasharray = `${percent * 100} ${100 - (percent * 100)}`;
    const strokeDashoffset = 100 - cumulativePercent + 25; // starting from 12 o'clock
    cumulativePercent += percent * 100;
    return {
      strokeDasharray,
      strokeDashoffset,
      color: colors[idx],
      label: labels[idx],
      val,
      percentage: Math.round(percent * 100)
    };
  }).filter(Boolean);

  return (
    <div className="flex-1 bg-slate-100 p-4 md:p-6 overflow-y-auto select-none">
      {/* Header sheet card */}
      <div className="bg-white border border-slate-300 rounded-lg p-4 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-700" />
            Dashboard Analítico de Tarefas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Resumo visual gerado de forma dinâmica a partir das células preenchidas na planilha.
          </p>
        </div>
        <div className="text-xs font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-slate-600 self-start md:self-auto">
          Métricas calculadas para <span className="font-bold text-emerald-800">{total}</span> tarefas registradas.
        </div>
      </div>

      {/* KPI Cards Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Tasks */}
        <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de Tarefas</p>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-1">{total}</h3>
            <p className="text-xs text-slate-500 mt-1">linhas preenchidas</p>
          </div>
          <div className="bg-slate-100 p-2.5 rounded-lg text-slate-600">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>

        {/* Avg Progress */}
        <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progresso Médio</p>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-1">{avgProgress}%</h3>
            <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-200">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${avgProgress}%` }} />
            </div>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-700">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Concluídas</p>
            <h3 className="text-2xl md:text-3xl font-extrabold text-emerald-700 mt-1">{completed}</h3>
            <p className="text-xs text-slate-500 mt-1">
              {total ? Math.round((completed / total) * 100) : 0}% de conclusão
            </p>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>

        {/* Active execution */}
        <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Em Andamento</p>
            <h3 className="text-2xl md:text-3xl font-extrabold mt-1 text-slate-800">{started + inProgress1 + inProgress2}</h3>
            <p className="text-xs text-slate-500 mt-1">em execução ativa</p>
          </div>
          <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart: Status Distribution */}
        <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm flex flex-col">
          <h4 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2 mb-4">
            Distribuição por Status (Graf. Pizza)
          </h4>
          
          {total === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 italic text-xs h-64">
              Nenhum dado para exibir no gráfico de status.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-around flex-1 gap-6 py-4">
              {/* SVG Donut */}
              <div className="relative w-44 h-44">
                <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4.5" />
                  {slices.map((slice, i) => slice && (
                    <circle
                      key={i}
                      cx="21"
                      cy="21"
                      r="15.915"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="4.5"
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      className="transition-all duration-500 hover:stroke-[5.5] cursor-pointer"
                    />
                  ))}
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-800">{total}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tarefas</span>
                </div>
              </div>

              {/* Legends list */}
              <div className="flex flex-col space-y-2.5 w-full sm:w-auto">
                {slices.map((slice, i) => slice && (
                  <div key={i} className="flex items-center justify-between sm:justify-start gap-4 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                      <span className="font-medium text-slate-600">{slice.label}</span>
                    </div>
                    <span className="font-mono text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded ml-auto sm:ml-4">
                      {slice.val} ({slice.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Horizontal Bar Chart: Priority Distribution */}
        <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm flex flex-col">
          <h4 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2 mb-4">
            Volumetria por Prioridade (Graf. Barras)
          </h4>

          {total === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 italic text-xs h-64">
              Nenhum dado para exibir no gráfico de prioridades.
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center space-y-5 py-4">
              {/* High Priority Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-rose-700 flex items-center gap-1">Prioridade Alta</span>
                  <span className="font-mono text-slate-700 font-bold">{priorityHigh} tarefas</span>
                </div>
                <div className="w-full bg-slate-100 h-6 rounded border border-slate-200 overflow-hidden relative flex items-center">
                  <div 
                    className="bg-rose-500 h-full rounded transition-all duration-500" 
                    style={{ width: `${total ? (priorityHigh / total) * 100 : 0}%` }}
                  />
                  <span className="absolute left-2.5 text-[10px] font-bold text-slate-500 z-10 font-mono">
                    {total ? Math.round((priorityHigh / total) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Medium Priority Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-amber-700 flex items-center gap-1">Prioridade Média</span>
                  <span className="font-mono text-slate-700 font-bold">{priorityMedium} tarefas</span>
                </div>
                <div className="w-full bg-slate-100 h-6 rounded border border-slate-200 overflow-hidden relative flex items-center">
                  <div 
                    className="bg-amber-500 h-full rounded transition-all duration-500" 
                    style={{ width: `${total ? (priorityMedium / total) * 100 : 0}%` }}
                  />
                  <span className="absolute left-2.5 text-[10px] font-bold text-slate-500 z-10 font-mono">
                    {total ? Math.round((priorityMedium / total) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Low Priority Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-emerald-700 flex items-center gap-1">Prioridade Baixa</span>
                  <span className="font-mono text-slate-700 font-bold">{priorityLow} tarefas</span>
                </div>
                <div className="w-full bg-slate-100 h-6 rounded border border-slate-200 overflow-hidden relative flex items-center">
                  <div 
                    className="bg-emerald-500 h-full rounded transition-all duration-500" 
                    style={{ width: `${total ? (priorityLow / total) * 100 : 0}%` }}
                  />
                  <span className="absolute left-2.5 text-[10px] font-bold text-slate-500 z-10 font-mono">
                    {total ? Math.round((priorityLow / total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task List Quick Grid Summary */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 mt-6 shadow-sm">
        <h4 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-2 mb-4 flex items-center justify-between">
          <span>Resumo dos Responsáveis</span>
          <Users className="w-4 h-4 text-slate-400" />
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from(new Set(tasks.map(t => t.assignee).filter(Boolean))).map((name, i) => {
            const userTasks = tasks.filter(t => t.assignee === name);
            const userCompleted = userTasks.filter(t => t.status === 'Concluído').length;
            const progressSum = userTasks.reduce((sum, t) => sum + t.progress, 0);
            const userAvgProgress = Math.round(progressSum / userTasks.length);

            return (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
                <div className="flex items-center space-x-2 border-b border-slate-200 pb-1.5 mb-2">
                  <div className="w-5 h-5 bg-emerald-800 text-white font-bold rounded-full flex items-center justify-center text-[10px] uppercase">
                    {name.charAt(0)}
                  </div>
                  <span className="font-bold text-slate-700 truncate">{name}</span>
                </div>
                <div className="space-y-1 text-slate-500">
                  <div className="flex justify-between">
                    <span>Tarefas ativas:</span>
                    <span className="font-bold text-slate-700">{userTasks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Concluídas:</span>
                    <span className="font-bold text-emerald-600">{userCompleted}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Progresso Médio:</span>
                    <span className="font-bold text-slate-700">{userAvgProgress}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
