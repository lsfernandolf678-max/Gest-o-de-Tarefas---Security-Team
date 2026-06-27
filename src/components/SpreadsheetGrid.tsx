/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Filter, 
  ChevronUp, 
  ChevronDown,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  ExternalLink
} from 'lucide-react';
import { Task, ColumnConfig, TaskField, CellStyle, CellSelection, PriorityType, StatusType } from '../types';
import { COLUMNS, PRIORITIES, STATUSES, ASSIGNEES } from '../constants';

const formatDateToBR = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

interface SpreadsheetGridProps {
  tasks: Task[];
  onUpdateTask: (id: string, field: TaskField, value: any) => void;
  selectedCell: CellSelection | null;
  onSelectCell: (selection: CellSelection | null) => void;
  cellStyles: Record<string, CellStyle>;
  editingCell: CellSelection | null;
  onSetEditingCell: (selection: CellSelection | null) => void;
  searchTerm: string;
  sortBy: { field: TaskField | null; direction: 'asc' | 'desc' | null };
  onSort: (field: TaskField) => void;
  filters: Record<string, string>;
  onSetFilter: (field: TaskField, value: string) => void;
  onOpenDetail?: (taskId: string) => void;
}

export default function SpreadsheetGrid({
  tasks,
  onUpdateTask,
  selectedCell,
  onSelectCell,
  cellStyles,
  editingCell,
  onSetEditingCell,
  searchTerm,
  sortBy,
  onSort,
  filters,
  onSetFilter,
  onOpenDetail
}: SpreadsheetGridProps) {
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<TaskField | null>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  // Focus the input when entering edit mode
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      if ('select' in editInputRef.current) {
        // Safe selection range for input elements
        try {
          (editInputRef.current as HTMLInputElement).select();
        } catch (e) {
          // Ignore for select/date inputs which don't support select()
        }
      }
    }
  }, [editingCell]);

  // Focus grid container to receive keyboard events
  useEffect(() => {
    if (selectedCell && !editingCell && gridContainerRef.current) {
      gridContainerRef.current.focus();
    }
  }, [selectedCell, editingCell]);

  // Handle Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell) return;

    // Get current task index and column index
    const currentTaskIndex = tasks.findIndex(t => t.id === selectedCell.rowId);
    const currentColIndex = COLUMNS.findIndex(c => c.field === selectedCell.field);

    if (currentTaskIndex === -1 || currentColIndex === -1) return;

    const isEditing = !!editingCell;

    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Save and move down
        onSetEditingCell(null);
        if (currentTaskIndex < tasks.length - 1) {
          onSelectCell({
            rowId: tasks[currentTaskIndex + 1].id,
            field: selectedCell.field
          });
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onSetEditingCell(null);
      }
      return;
    }

    // Navigation mode
    let targetTaskIndex = currentTaskIndex;
    let targetColIndex = currentColIndex;
    let handled = false;

    switch (e.key) {
      case 'ArrowUp':
        if (currentTaskIndex > 0) targetTaskIndex--;
        handled = true;
        break;
      case 'ArrowDown':
        if (currentTaskIndex < tasks.length - 1) targetTaskIndex++;
        handled = true;
        break;
      case 'ArrowLeft':
        if (currentColIndex > 0) targetColIndex--;
        handled = true;
        break;
      case 'ArrowRight':
        if (currentColIndex < COLUMNS.length - 1) targetColIndex++;
        handled = true;
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          if (currentColIndex > 0) targetColIndex--;
        } else {
          if (currentColIndex < COLUMNS.length - 1) targetColIndex++;
        }
        handled = true;
        break;
      case 'Enter':
      case 'F2':
        e.preventDefault();
        // Enter edit mode
        if (selectedCell.field !== 'id') {
          onSetEditingCell(selectedCell);
        }
        handled = true;
        break;
      case 'Backspace':
      case 'Delete':
        // Clear cell value if not id
        if (selectedCell.field !== 'id') {
          onUpdateTask(selectedCell.rowId, selectedCell.field, selectedCell.field === 'progress' ? 0 : '');
          handled = true;
        }
        break;
      default:
        // Direct typing triggers edit mode
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && selectedCell.field !== 'id') {
          onSetEditingCell(selectedCell);
          // Small timeout to let input render and receive value
          setTimeout(() => {
            if (editInputRef.current) {
              editInputRef.current.value = e.key;
              onUpdateTask(selectedCell.rowId, selectedCell.field, e.key);
            }
          }, 10);
          handled = true;
        }
        break;
    }

    if (handled) {
      e.preventDefault();
      onSelectCell({
        rowId: tasks[targetTaskIndex].id,
        field: COLUMNS[targetColIndex].field
      });
    }
  };

  const handleCellClick = (rowId: string, field: TaskField, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectCell({ rowId, field });
    onSetEditingCell(null);

    if (field === 'description') {
      onOpenDetail?.(rowId);
    } else {
      const isSameCell = selectedCell?.rowId === rowId && selectedCell?.field === field;
      if (isSameCell && field !== 'id') {
        onSetEditingCell({ rowId, field });
      }
    }
  };

  // Helper to format cell styles
  const getCellClassName = (rowId: string, field: TaskField, baseValue: any) => {
    const styleKey = `${rowId}:${field}`;
    const style = cellStyles[styleKey] || {};
    let classes = 'transition-all duration-75 ';

    // Alignment
    if (style.align === 'center') classes += 'text-center justify-center ';
    else if (style.align === 'right') classes += 'text-right justify-end ';
    else classes += 'text-left justify-start ';

    // Typography
    if (style.bold) classes += 'font-bold ';
    if (style.italic) classes += 'italic ';
    if (style.underline) classes += 'underline ';

    // Text Color
    if (style.textColor) {
      classes += `${style.textColor} `;
    } else {
      if (field === 'id') classes += 'text-slate-400 ';
      else classes += 'text-slate-800 ';
    }

    // BG Color (Excel fill or custom highlight or default status coloring)
    if (searchTerm && String(baseValue).toLowerCase().includes(searchTerm.toLowerCase())) {
      classes += 'bg-amber-200 '; // Search highlight
    } else if (style.bgColor) {
      classes += `${style.bgColor} `;
    } else {
      // Alternating row background for clean grid aesthetic
      classes += 'bg-white ';
    }

    return classes;
  };

  // Get list of unique options in that field for filtering
  const getUniqueOptionsForField = (field: TaskField): string[] => {
    const values = tasks.map(t => String(t[field])).filter(Boolean);
    return Array.from(new Set(values));
  };

  // Render priority badges with clean excel styling
  const renderPriorityBadge = (prio: PriorityType) => {
    const styles = {
      Alta: 'bg-rose-50 text-rose-700 border-rose-200',
      Média: 'bg-amber-50 text-amber-700 border-amber-200',
      Baixa: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[prio] || 'bg-slate-50 border-slate-200'}`}>
        {prio}
      </span>
    );
  };

  // Render status indicator
  const renderStatusBadge = (status: StatusType) => {
    const styles = {
      'Não iniciada': 'bg-slate-100 text-slate-700 border-slate-200',
      'Iniciada': 'bg-sky-50 text-sky-700 border-sky-200',
      'Em andamento - 1': 'bg-blue-50 text-blue-700 border-blue-200',
      'Em andamento - 2 (quase finalizado)': 'bg-amber-50 text-amber-800 border-amber-200',
      'Concluído': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
    const circleColors = {
      'Não iniciada': 'bg-slate-400',
      'Iniciada': 'bg-sky-500',
      'Em andamento - 1': 'bg-blue-500',
      'Em andamento - 2 (quase finalizado)': 'bg-amber-500',
      'Concluído': 'bg-emerald-500',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${circleColors[status] || 'bg-slate-400'}`} />
        {status}
      </span>
    );
  };

  return (
    <div 
      ref={gridContainerRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="flex-1 overflow-auto bg-slate-200 select-none relative focus:outline-none"
      onClick={() => {
        onSelectCell(null);
        onSetEditingCell(null);
        setActiveFilterDropdown(null);
      }}
    >
      <table className="w-full border-collapse border-spacing-0 table-fixed bg-white text-xs font-sans min-w-[1200px]">
        {/* Table Header Row: letters and column names */}
        <thead className="sticky top-0 z-20 bg-slate-100 shadow-sm">
          {/* Letters row: A, B, C, D... */}
          <tr className="bg-slate-50 border-b border-slate-300 h-6">
            <th className="w-12 bg-slate-200 border-r border-slate-300 text-slate-500 font-mono font-medium text-[10px] text-center sticky left-0 z-30 select-none">
              &nbsp;
            </th>
            {COLUMNS.map((col) => {
              const isColSelected = selectedCell?.field === col.field;
              return (
                <th 
                  key={col.letter} 
                  className={`border-r border-slate-300 text-[10px] font-mono font-bold text-center select-none transition-colors ${
                    isColSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {col.letter}
                </th>
              );
            })}
          </tr>

          {/* Semantic Headers row: "Tarefa / Título", "Prioridade", etc. */}
          <tr className="border-b border-slate-300 h-9 bg-slate-100">
            <th className="w-12 bg-slate-200 border-r border-slate-300 text-slate-700 font-bold text-xs text-center sticky left-0 z-30">
              ID
            </th>
            {COLUMNS.map((col) => {
              const isColSelected = selectedCell?.field === col.field;
              const hasFilterActive = !!filters[col.field];
              return (
                <th
                  key={col.field}
                  className={`border-r border-slate-300 text-left px-3 text-slate-700 font-semibold relative select-none group transition-colors ${col.width} ${
                    isColSelected ? 'bg-emerald-50 text-emerald-900 border-b-2 border-b-emerald-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{col.label}</span>
                    
                    {/* Header buttons: Sort & Filter */}
                    <div className="flex items-center space-x-1 ml-1">
                      {/* Sort toggle indicator */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSort(col.field);
                        }}
                        className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        title="Ordenar Coluna"
                      >
                        {sortBy.field === col.field ? (
                          sortBy.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-emerald-600 font-bold" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                        ) : (
                          <div className="flex flex-col -space-y-1">
                            <ChevronUp className="w-2.5 h-2.5 opacity-60" />
                            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                          </div>
                        )}
                      </button>

                      {/* Filter dropdown button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFilterDropdown(activeFilterDropdown === col.field ? null : col.field);
                        }}
                        className={`p-0.5 rounded hover:bg-slate-200 transition-colors cursor-pointer ${
                          hasFilterActive ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="Filtrar Coluna"
                      >
                        <Filter className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Excel Column Filter Dropdown Card */}
                  {activeFilterDropdown === col.field && (
                    <div 
                      className="absolute right-1 top-8 bg-white border border-slate-300 rounded shadow-xl z-50 p-2 text-xs font-normal w-52 text-slate-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                        <span className="font-bold text-slate-500">Filtrar por:</span>
                        <button 
                          onClick={() => setActiveFilterDropdown(null)}
                          className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Filter Option List */}
                      <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
                        <button
                          onClick={() => {
                            onSetFilter(col.field, '');
                            setActiveFilterDropdown(null);
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                            !filters[col.field] ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50'
                          }`}
                        >
                          (Mostrar Tudo)
                        </button>
                        {getUniqueOptionsForField(col.field).map((val) => (
                          <button
                            key={val}
                            onClick={() => {
                              onSetFilter(col.field, val);
                              setActiveFilterDropdown(null);
                            }}
                            className={`w-full text-left px-2 py-1 rounded text-xs truncate transition-colors ${
                              filters[col.field] === val ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50'
                            }`}
                            title={val}
                          >
                            {val}
                          </button>
                        ))}
                      </div>

                      {hasFilterActive && (
                        <button
                          onClick={() => {
                            onSetFilter(col.field, '');
                            setActiveFilterDropdown(null);
                          }}
                          className="w-full py-1 text-center text-[10px] text-red-600 hover:bg-red-50 border border-red-200 rounded font-bold transition-colors"
                        >
                          Limpar Filtro
                        </button>
                      )}
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Spreadsheet Body */}
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length + 1} className="py-12 bg-white text-center text-slate-400 italic">
                Nenhuma tarefa encontrada. Clique em "+ Linha" para adicionar uma nova tarefa!
              </td>
            </tr>
          ) : (
            tasks.map((task, rIndex) => {
              const rowNum = rIndex + 1;
              const isRowSelected = selectedCell?.rowId === task.id;

              return (
                <tr 
                  key={task.id} 
                  className={`border-b border-slate-200 min-h-[32px] hover:bg-slate-50/50 transition-colors ${
                    isRowSelected ? 'bg-emerald-50/20' : ''
                  }`}
                >
                  {/* Left row index cell (1, 2, 3...) */}
                  <td 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCell({ rowId: task.id, field: COLUMNS[0].field });
                      onSetEditingCell(null);
                    }}
                    className={`w-12 border-r border-slate-300 text-center font-mono font-bold text-[10px] cursor-pointer sticky left-0 z-10 transition-colors ${
                      isRowSelected ? 'bg-emerald-200 text-emerald-800 border-r-2 border-r-emerald-500' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {rowNum}
                  </td>

                  {/* Content Cells */}
                  {COLUMNS.map((col) => {
                    const value = task[col.field];
                    const isSelected = selectedCell?.rowId === task.id && selectedCell?.field === col.field;
                    const isEditing = editingCell?.rowId === task.id && editingCell?.field === col.field;
                    const cellClass = getCellClassName(task.id, col.field, value);

                    return (
                      <td
                        key={col.field}
                        onClick={(e) => handleCellClick(task.id, col.field, e)}
                        className={`border-r border-slate-200 px-2 py-1.5 relative cursor-cell min-h-[32px] h-auto select-none transition-all ${cellClass} ${
                          isSelected ? 'outline outline-2 outline-emerald-600 z-10 shadow-md' : ''
                        }`}
                      >
                        {isEditing ? (
                          // RENDER CORRESPONDING FORM CONTROL IN EDIT MODE
                          <div className="absolute inset-0 z-20 w-full h-full bg-white flex items-center shadow-inner">
                            {col.type === 'select' ? (
                              <select
                                ref={editInputRef as React.RefObject<HTMLSelectElement>}
                                value={value}
                                onChange={(e) => onUpdateTask(task.id, col.field, e.target.value)}
                                onBlur={() => onSetEditingCell(null)}
                                className="w-full h-full border-0 px-2 bg-white text-xs text-slate-800 font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              >
                                {col.field === 'priority' ? (
                                  PRIORITIES.map(opt => <option key={opt} value={opt}>{opt}</option>)
                                ) : col.field === 'status' ? (
                                  STATUSES.map(opt => <option key={opt} value={opt}>{opt}</option>)
                                ) : (
                                  ASSIGNEES.map(opt => <option key={opt} value={opt}>{opt}</option>)
                                )}
                              </select>
                            ) : col.type === 'date' ? (
                              <input
                                ref={editInputRef as React.RefObject<HTMLInputElement>}
                                type="date"
                                value={value}
                                onChange={(e) => onUpdateTask(task.id, col.field, e.target.value)}
                                onBlur={() => onSetEditingCell(null)}
                                className="w-full h-full border-0 px-2 bg-white text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            ) : col.type === 'number' ? (
                              <input
                                ref={editInputRef as React.RefObject<HTMLInputElement>}
                                type="number"
                                min={0}
                                max={100}
                                value={value}
                                onChange={(e) => {
                                  const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                  onUpdateTask(task.id, col.field, val);
                                }}
                                onBlur={() => onSetEditingCell(null)}
                                className="w-full h-full border-0 px-2 bg-white text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            ) : (
                              <input
                                ref={editInputRef as React.RefObject<HTMLInputElement>}
                                type="text"
                                value={value}
                                onChange={(e) => onUpdateTask(task.id, col.field, e.target.value)}
                                onBlur={() => onSetEditingCell(null)}
                                className="w-full h-full border-0 px-2 bg-white text-xs text-slate-800 font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            )}
                          </div>
                        ) : (
                          // RENDER CELL DISPLAY VALUE IN READ MODE
                          <div className="flex items-center w-full min-h-full overflow-hidden">
                            {col.field === 'priority' ? (
                              renderPriorityBadge(value as PriorityType)
                            ) : col.field === 'status' ? (
                              renderStatusBadge(value as StatusType)
                            ) : col.field === 'progress' ? (
                              <div className="flex items-center space-x-2 w-full pr-1 font-mono">
                                <div className="w-12 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200 hidden xs:block">
                                  <div 
                                    className={`${Number(value) === 100 ? 'bg-emerald-500' : 'bg-emerald-600'} h-full rounded-full transition-all duration-300`} 
                                    style={{ width: `${value}%` }} 
                                  />
                                </div>
                                <span className={Number(value) === 100 ? "text-emerald-600 font-bold" : "text-slate-600 font-semibold"}>
                                  {value}%
                                </span>
                              </div>
                            ) : col.field === 'deadline' && value ? (
                              <div className="flex items-center space-x-1.5 text-slate-600 font-mono">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{formatDateToBR(String(value))}</span>
                              </div>
                            ) : col.field === 'assignee' && value ? (
                              <div className="flex items-center space-x-1.5 text-slate-700 truncate">
                                <div className="w-4 h-4 bg-emerald-100 text-emerald-800 font-black rounded-full flex items-center justify-center text-[9px] shrink-0 uppercase">
                                  {String(value).charAt(0)}
                                </div>
                                <span className="truncate">{value}</span>
                              </div>
                            ) : col.field === 'description' ? (
                              <div className="flex items-start justify-between w-full text-slate-700 hover:text-emerald-700 transition-colors group cursor-pointer py-0.5">
                                <span className="whitespace-normal break-words select-text pr-2 leading-normal block w-full text-xs" title={String(value)}>
                                  {value === '' || value === undefined ? (
                                    <span className="text-slate-400 italic">Clique para ver/editar</span>
                                  ) : (
                                    String(value)
                                  )}
                                </span>
                                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity mt-0.5" />
                              </div>
                            ) : col.field === 'title' ? (
                              <span className="whitespace-normal break-words block w-full text-xs font-semibold text-slate-800 leading-normal py-0.5 select-text" title={String(value)}>
                                {value === '' || value === undefined ? <span className="text-slate-300 italic">vazio</span> : String(value)}
                              </span>
                            ) : (
                              <span className="truncate block w-full" title={String(value)}>
                                {value === '' || value === undefined ? <span className="text-slate-300 italic">vazio</span> : String(value)}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
