/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Paintbrush, 
  Trash2, 
  PlusCircle, 
  Download, 
  Upload, 
  Search, 
  X,
  RotateCcw,
  RotateCw,
  ChevronDown,
  Sparkles,
  Shield,
  LogOut,
  User as UserIcon,
  Mail
} from 'lucide-react';
import { CellStyle, UserSession } from '../types';
import { PRESET_BG_COLORS, PRESET_TEXT_COLORS } from '../constants';

interface ToolbarProps {
  activeStyle: CellStyle;
  onApplyStyle: (style: Partial<CellStyle>) => void;
  onAddRow: () => void;
  onDeleteSelectedRow: () => void;
  onExportCSV: () => void;
  onImportCSV: (file: File) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onClearStyles: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  onGenerateTasksAI?: () => void; // Optional AI suggestion row
  currentUser: UserSession;
  onLogout: () => void;
  onSaveSpreadsheet?: () => void;
  isSaving?: boolean;
  onOpenEmailLogs?: () => void;
}

export default function Toolbar({
  activeStyle,
  onApplyStyle,
  onAddRow,
  onDeleteSelectedRow,
  onExportCSV,
  onImportCSV,
  searchTerm,
  onSearchChange,
  onClearStyles,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  hasSelection,
  onGenerateTasksAI,
  currentUser,
  onLogout,
  onSaveSpreadsheet,
  isSaving = false,
  onOpenEmailLogs
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showBgDropdown, setShowBgDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCSV(file);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    }
  };

  const toggleStyle = (key: 'bold' | 'italic' | 'underline') => {
    onApplyStyle({ [key]: !activeStyle[key] });
  };

  const applyAlign = (align: 'left' | 'center' | 'right') => {
    onApplyStyle({ align: activeStyle.align === align ? undefined : align });
  };

  return (
    <div id="excel-toolbar-ribbon" className="bg-slate-50 border-b border-slate-300 flex flex-col select-none">
      {/* Top green bar with application name & general menu */}
      <div className="bg-emerald-800 text-white px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm shrink-0">
        <div className="flex items-center space-x-3">
          <div className="bg-white text-emerald-800 p-1.5 rounded-md shadow-inner flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-800 fill-emerald-800" />
          </div>
          <div>
            <h1 className="font-sans font-semibold tracking-tight text-sm md:text-base text-white flex items-center gap-1.5">
              Gestão de Tarefas - Security Team
              <span className="text-[10px] bg-emerald-700 text-emerald-200 px-1.5 py-0.5 rounded font-mono font-normal">
                v2026.1
              </span>
            </h1>
          </div>
        </div>

        {/* User Session, Action controls / Undo-Redo & Export */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 justify-between md:justify-end">
          {/* Active User Information */}
          <div className="flex items-center space-x-2.5 bg-emerald-900/60 border border-emerald-700/50 rounded-xl px-3 py-1 text-xs text-emerald-100">
            <div className="w-6 h-6 bg-emerald-100 text-emerald-800 font-bold rounded-full flex items-center justify-center text-[10px] shadow-sm uppercase">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-bold text-white text-[11px] leading-tight">{currentUser.name}</div>
              <div className="text-[9px] text-emerald-300 font-mono tracking-wider uppercase leading-none">
                {currentUser.role === 'admin' ? '🛡️ Administrador' : '👥 Operador'}
              </div>
            </div>
            {/* Mobile simplified role badge */}
            <span className="sm:hidden text-[9px] bg-emerald-700 text-emerald-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              {currentUser.role === 'admin' ? 'Admin' : 'Membro'}
            </span>
          </div>

          <div className="flex items-center space-x-1 border-r border-emerald-700/60 pr-3 md:pr-4">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Desfazer (Ctrl+Z)"
              className="p-1 rounded hover:bg-emerald-700 text-emerald-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Refazer (Ctrl+Y)"
              className="p-1 rounded hover:bg-emerald-700 text-emerald-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (currentUser.role !== 'admin') {
                  alert('Apenas administradores podem importar planilhas de tarefas via CSV.');
                  return;
                }
                fileInputRef.current?.click();
              }}
              disabled={currentUser.role !== 'admin'}
              className={`text-xs px-2.5 py-1.5 rounded text-emerald-50 font-medium transition-all flex items-center gap-1 ${
                currentUser.role === 'admin' 
                  ? 'bg-emerald-700 hover:bg-emerald-600 cursor-pointer' 
                  : 'bg-emerald-900/40 text-emerald-300/50 cursor-not-allowed opacity-60 border border-emerald-800/30'
              }`}
              title={currentUser.role === 'admin' ? 'Importar planilha de tarefas via CSV' : 'Importar (Permissão Administrador necessária)'}
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Importar</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <button
              onClick={onExportCSV}
              className="text-xs bg-white text-emerald-800 hover:bg-emerald-50 px-2.5 py-1.5 rounded font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow"
              title="Exportar tarefas para CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>

            {/* Save Button */}
            <button
              onClick={onSaveSpreadsheet}
              disabled={isSaving}
              className={`text-xs px-2.5 py-1.5 rounded font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow border ${
                isSaving
                  ? 'bg-amber-600 text-white border-amber-500 cursor-wait'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
              title="Salvar Planilha de Tarefas permanentemente no Servidor"
            >
              <svg 
                className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                {isSaving ? (
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                ) : (
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8" />
                )}
              </svg>
              <span>{isSaving ? 'Salvando...' : 'Salvar Planilha'}</span>
            </button>

            {/* Email notification audit logs */}
            <button
              onClick={onOpenEmailLogs}
              className="text-xs bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white px-2.5 py-1.5 rounded font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow border border-slate-700"
              title="Auditoria de E-mails enviados para L.FPINHO@BTP.COM.BR"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Log de E-mails</span>
            </button>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="p-1.5 rounded bg-emerald-900/40 border border-emerald-700 hover:bg-rose-950/40 hover:border-rose-700 text-emerald-100 hover:text-rose-200 transition-all cursor-pointer"
              title="Sair do Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Ribbon Buttons Bar */}
      <div className="px-4 py-1.5 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between text-slate-700 bg-white">
        {/* Formatting sections */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Font Styles Segment */}
          <div className="flex items-center space-x-0.5 border-r border-slate-200 pr-2">
            <button
              onClick={() => toggleStyle('bold')}
              title="Negrito (Ctrl+B)"
              className={`p-1.5 rounded transition-all cursor-pointer ${
                activeStyle.bold 
                  ? 'bg-slate-200 text-slate-900 border border-slate-400 font-bold' 
                  : 'hover:bg-slate-100 border border-transparent'
              }`}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleStyle('italic')}
              title="Itálico (Ctrl+I)"
              className={`p-1.5 rounded transition-all cursor-pointer ${
                activeStyle.italic 
                  ? 'bg-slate-200 text-slate-900 border border-slate-400 font-bold' 
                  : 'hover:bg-slate-100 border border-transparent'
              }`}
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleStyle('underline')}
              title="Sublinhado (Ctrl+U)"
              className={`p-1.5 rounded transition-all cursor-pointer ${
                activeStyle.underline 
                  ? 'bg-slate-200 text-slate-900 border border-slate-400 font-bold' 
                  : 'hover:bg-slate-100 border border-transparent'
              }`}
            >
              <Underline className="w-4 h-4" />
            </button>
          </div>

          {/* Color Presets Segment */}
          <div className="flex items-center space-x-2 border-r border-slate-200 pr-2">
            {/* Background Fill Color */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowBgDropdown(!showBgDropdown);
                  setShowColorDropdown(false);
                }}
                className={`flex items-center gap-1 p-1.5 rounded border border-transparent hover:bg-slate-100 transition-colors cursor-pointer ${
                  activeStyle.bgColor ? 'bg-emerald-50 border-emerald-200' : ''
                }`}
                title="Cor de Fundo da Célula"
              >
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-sm border border-slate-300 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                    <span className={`w-full h-full block ${activeStyle.bgColor || 'bg-white'}`} />
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {showBgDropdown && (
                <div className="absolute left-0 mt-1.5 w-44 bg-white border border-slate-300 rounded-md shadow-lg z-50 p-2">
                  <p className="text-[10px] font-bold text-slate-400 mb-1 px-1 tracking-wider uppercase">Preenchimento</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PRESET_BG_COLORS.map((bg) => (
                      <button
                        key={bg.class}
                        onClick={() => {
                          onApplyStyle({ bgColor: bg.class === 'bg-white' ? undefined : bg.class });
                          setShowBgDropdown(false);
                        }}
                        className={`w-8 h-8 rounded border ${bg.class} ${bg.border} hover:scale-110 transition-transform cursor-pointer`}
                        title={bg.label}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Font Color */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowColorDropdown(!showColorDropdown);
                  setShowBgDropdown(false);
                }}
                className={`flex items-center gap-1 p-1.5 rounded border border-transparent hover:bg-slate-100 transition-colors cursor-pointer ${
                  activeStyle.textColor ? 'bg-emerald-50 border-emerald-200' : ''
                }`}
                title="Cor da Fonte"
              >
                <div className="flex flex-col items-center">
                  <span className={`font-mono text-xs font-black leading-none ${activeStyle.textColor || 'text-slate-800'}`}>A</span>
                  <div className={`w-4 h-0.5 mt-0.5 ${activeStyle.textColor ? activeStyle.textColor.replace('text', 'bg') : 'bg-slate-800'}`} />
                </div>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {showColorDropdown && (
                <div className="absolute left-0 mt-1.5 w-44 bg-white border border-slate-300 rounded-md shadow-lg z-50 p-2">
                  <p className="text-[10px] font-bold text-slate-400 mb-1 px-1 tracking-wider uppercase">Cor da Letra</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PRESET_TEXT_COLORS.map((tc) => (
                      <button
                        key={tc.class}
                        onClick={() => {
                          onApplyStyle({ textColor: tc.class === 'text-slate-900' ? undefined : tc.class });
                          setShowColorDropdown(false);
                        }}
                        className={`w-8 h-8 rounded border border-slate-200 bg-slate-50 flex items-center justify-center font-bold hover:scale-110 transition-transform cursor-pointer ${tc.class}`}
                        title={tc.label}
                      >
                        A
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Clear Cell Formatting */}
            <button
              onClick={onClearStyles}
              title="Limpar Formatação da Célula"
              className="p-1.5 rounded hover:bg-slate-100 transition-colors cursor-pointer text-slate-500"
            >
              <Paintbrush className="w-4 h-4" />
            </button>
          </div>

          {/* Alignment Segment */}
          <div className="flex items-center space-x-0.5 border-r border-slate-200 pr-2">
            <button
              onClick={() => applyAlign('left')}
              title="Alinhar à Esquerda"
              className={`p-1.5 rounded transition-all cursor-pointer ${
                activeStyle.align === 'left' 
                  ? 'bg-slate-200 text-slate-900 border border-slate-400' 
                  : 'hover:bg-slate-100 border border-transparent'
              }`}
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyAlign('center')}
              title="Alinhar ao Centro"
              className={`p-1.5 rounded transition-all cursor-pointer ${
                activeStyle.align === 'center' 
                  ? 'bg-slate-200 text-slate-900 border border-slate-400' 
                  : 'hover:bg-slate-100 border border-transparent'
              }`}
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => applyAlign('right')}
              title="Alinhar à Direita"
              className={`p-1.5 rounded transition-all cursor-pointer ${
                activeStyle.align === 'right' 
                  ? 'bg-slate-200 text-slate-900 border border-slate-400' 
                  : 'hover:bg-slate-100 border border-transparent'
              }`}
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          {/* Task Operations Segment */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onAddRow}
              className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Inserir Nova Tarefa (Linha)"
            >
              <PlusCircle className="w-4 h-4 text-emerald-700" />
              <span>+ Linha</span>
            </button>
            <button
              onClick={() => {
                if (currentUser.role !== 'admin') {
                  alert('Apenas administradores podem excluir tarefas do sistema.');
                  return;
                }
                onDeleteSelectedRow();
              }}
              disabled={!hasSelection || currentUser.role !== 'admin'}
              className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                hasSelection && currentUser.role === 'admin'
                  ? 'bg-red-50 text-red-800 hover:bg-red-100 border-red-200 cursor-pointer'
                  : 'bg-slate-50 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
              }`}
              title={
                currentUser.role === 'admin'
                  ? 'Excluir Linha Selecionada'
                  : 'Excluir Linha (Permissão Administrador necessária)'
              }
            >
              <Trash2 className={`w-4 h-4 ${hasSelection && currentUser.role === 'admin' ? 'text-red-700' : 'text-slate-400'}`} />
              <span>Excluir Linha</span>
            </button>
          </div>
        </div>

        {/* AI & Search Section */}
        <div className="flex items-center space-x-3 w-full md:w-auto mt-2 md:mt-0">
          {/* AI generator option if provided */}
          {onGenerateTasksAI && (
            <button
              onClick={onGenerateTasksAI}
              className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
              title="Gerar sugestão de tarefas usando IA"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>Gerar IA</span>
            </button>
          )}

          {/* Quick Search */}
          <div className="relative flex items-center w-full md:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar em células..."
              className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all font-sans"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
