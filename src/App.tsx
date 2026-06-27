/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { COLUMNS, INITIAL_TASKS } from './constants';
import { Task, CellStyle, CellSelection, TaskField, SheetTab, UserSession } from './types';
import Toolbar from './components/Toolbar';
import FormulaBar from './components/FormulaBar';
import SpreadsheetGrid from './components/SpreadsheetGrid';
import DashboardSheet from './components/DashboardSheet';
import HelpSheet from './components/HelpSheet';
import Tabs from './components/Tabs';
import TaskDetailView from './components/TaskDetailView';
import LoginScreen from './components/LoginScreen';
import UserManagementSheet from './components/UserManagementSheet';
import ChatSheet from './components/ChatSheet';

export default function App() {
  // --- 1. Core States ---
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('security_team_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Falha ao ler sessão do localStorage', e);
      }
    }
    return null;
  });

  const [activeDetailTaskId, setActiveDetailTaskId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('excel_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Falha ao ler tarefas do localStorage', e);
      }
    }
    return INITIAL_TASKS;
  });

  const [cellStyles, setCellStyles] = useState<Record<string, CellStyle>>(() => {
    const saved = localStorage.getItem('excel_cell_styles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Falha ao ler estilos do localStorage', e);
      }
    }
    return {};
  });

  const [selectedCell, setSelectedCell] = useState<CellSelection | null>(null);
  const [editingCell, setEditingCell] = useState<CellSelection | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'tasks' | 'dashboard' | 'help' | 'users'>('tasks');

  // --- 2. Sorting & Filtering States ---
  const [sortBy, setSortBy] = useState<{ field: TaskField | null; direction: 'asc' | 'desc' | null }>({
    field: null,
    direction: null,
  });
  const [filters, setFilters] = useState<Record<string, string>>({});

  // --- 3. Undo / Redo History States ---
  const [history, setHistory] = useState<Array<{ tasks: Task[]; styles: Record<string, CellStyle> }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const handleLogin = (session: UserSession) => {
    setCurrentUser(session);
    localStorage.setItem('security_team_session', JSON.stringify(session));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('security_team_session');
    setSelectedCell(null);
    setEditingCell(null);
    setActiveTab('tasks');
  };

  // --- 4. Server Sync & Local Cache ---
  const saveAndSyncSpreadsheet = async (newTasks: Task[], newStyles: Record<string, CellStyle>, updateHistory: boolean = true) => {
    // A. Update local state
    setTasks(newTasks);
    setCellStyles(newStyles);
    
    // B. Cache in localStorage for fallback/speed
    localStorage.setItem('excel_tasks', JSON.stringify(newTasks));
    localStorage.setItem('excel_cell_styles', JSON.stringify(newStyles));

    // C. Save to History
    if (updateHistory) {
      saveToHistory(newTasks, newStyles);
    }

    // D. Send to backend server
    try {
      await fetch('/api/spreadsheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks: newTasks, cellStyles: newStyles }),
      });
    } catch (e) {
      console.error('Falha ao sincronizar planilha com o servidor', e);
    }

    // E. Broadcast to other tabs
    try {
      const channel = new BroadcastChannel('security_team_spreadsheet_channel');
      channel.postMessage({
        type: 'spreadsheet-update',
        payload: { tasks: newTasks, styles: newStyles }
      });
      channel.close();
    } catch (e) {
      // ignore
    }
  };

  // Fetch initial spreadsheet from server on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetch('/api/spreadsheet');
        if (res.ok) {
          const data = await res.json();
          if (data && data.tasks) {
            setTasks(data.tasks);
            setCellStyles(data.cellStyles || {});
            
            // Cache locally
            localStorage.setItem('excel_tasks', JSON.stringify(data.tasks));
            localStorage.setItem('excel_cell_styles', JSON.stringify(data.cellStyles || {}));
            
            // Set first item in history
            setHistory([{ tasks: data.tasks, styles: data.cellStyles || {} }]);
            setHistoryIndex(0);
          }
        }
      } catch (e) {
        console.error('Falha ao obter dados da planilha do servidor', e);
      }
    };
    fetchInitialData();
  }, []);

  // BroadcastChannel for instant multi-tab synchronization of same browser
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('security_team_spreadsheet_channel');
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'spreadsheet-update') {
          const { tasks: updatedTasks, styles: updatedStyles } = event.data.payload;
          setTasks(updatedTasks);
          setCellStyles(updatedStyles);
        }
      };
      return () => {
        channel.close();
      };
    } catch (e) {
      console.warn('BroadcastChannel não suportado neste navegador.', e);
    }
  }, []);

  // Storage listener fallback for other windows/tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'excel_tasks' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setTasks(parsed);
        } catch (err) {
          console.error(err);
        }
      }
      if (e.key === 'excel_cell_styles' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setCellStyles(parsed);
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Polling Spreadsheet Updates from the Server every 1.5 seconds (Multi-device Real-time Sync)
  useEffect(() => {
    let intervalId: number;
    
    const pollSpreadsheet = async () => {
      // Skip polling updates if the user is currently editing a cell to prevent interrupting their typing
      if (editingCell) return;
      
      try {
        const res = await fetch('/api/spreadsheet');
        if (res.ok) {
          const data = await res.json();
          if (data && data.tasks) {
            const currentTasksStr = JSON.stringify(tasks);
            const incomingTasksStr = JSON.stringify(data.tasks);
            const currentStylesStr = JSON.stringify(cellStyles);
            const incomingStylesStr = JSON.stringify(data.cellStyles || {});
            
            if (currentTasksStr !== incomingTasksStr || currentStylesStr !== incomingStylesStr) {
              setTasks(data.tasks);
              setCellStyles(data.cellStyles || {});
              
              // Cache in local storage
              localStorage.setItem('excel_tasks', JSON.stringify(data.tasks));
              localStorage.setItem('excel_cell_styles', JSON.stringify(data.cellStyles || {}));
            }
          }
        }
      } catch (e) {
        console.error('Erro ao buscar atualizações periódicas da planilha', e);
      }
    };

    intervalId = window.setInterval(pollSpreadsheet, 1500);
    return () => clearInterval(intervalId);
  }, [tasks, cellStyles, editingCell]);

  // --- 4. History Helpers ---
  const saveToHistory = (newTasks: Task[], newStyles: Record<string, CellStyle>) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    const updatedHistory = [...nextHistory, { tasks: newTasks, styles: newStyles }];
    
    // Limit history length to 50 items to keep memory slim
    if (updatedHistory.length > 50) {
      updatedHistory.shift();
      setHistoryIndex(updatedHistory.length - 1);
    } else {
      setHistoryIndex(updatedHistory.length - 1);
    }
    setHistory(updatedHistory);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevState = history[prevIndex];
      setHistoryIndex(prevIndex);
      saveAndSyncSpreadsheet(prevState.tasks, prevState.styles, false);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];
      setHistoryIndex(nextIndex);
      saveAndSyncSpreadsheet(nextState.tasks, nextState.styles, false);
    }
  };

  // --- 5. Data Actions ---
  const handleUpdateTask = (id: string, field: TaskField, value: any) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === id) {
        const updated = { ...t, [field]: value };
        
        // Auto-update progress when status changes
        if (field === 'status') {
          if (value === 'Não iniciada') updated.progress = 0;
          else if (value === 'Iniciada') updated.progress = 25;
          else if (value === 'Em andamento - 1') updated.progress = 50;
          else if (value === 'Em andamento - 2 (quase finalizado)') updated.progress = 75;
          else if (value === 'Concluído') updated.progress = 100;
        }
        // Auto-update status when progress changes
        else if (field === 'progress') {
          const numericProgress = Math.min(100, Math.max(0, parseInt(value) || 0));
          updated.progress = numericProgress;
          
          if (numericProgress === 0) {
            updated.status = 'Não iniciada';
          } else if (numericProgress > 0 && numericProgress < 50) {
            updated.status = 'Iniciada';
          } else if (numericProgress >= 50 && numericProgress < 75) {
            updated.status = 'Em andamento - 1';
          } else if (numericProgress >= 75 && numericProgress < 100) {
            updated.status = 'Em andamento - 2 (quase finalizado)';
          } else if (numericProgress === 100) {
            updated.status = 'Concluído';
          }
        }
        
        return updated;
      }
      return t;
    });

    saveAndSyncSpreadsheet(updatedTasks, cellStyles);
  };

  const handleAddRow = () => {
    // Generate a clean next numerical code
    const existingIds = tasks.map(t => parseInt(t.id.replace('T-', ''))).filter(Boolean);
    const nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 101;
    const nextId = `T-${nextNum}`;

    const newTask: Task = {
      id: nextId,
      title: 'Nova Tarefa',
      priority: 'Média',
      status: 'Não iniciada',
      deadline: new Date().toISOString().split('T')[0],
      assignee: 'Não atribuído',
      progress: 0,
      description: 'Dê um duplo clique aqui para adicionar uma descrição para esta tarefa.',
    };

    const updatedTasks = [...tasks, newTask];
    saveAndSyncSpreadsheet(updatedTasks, cellStyles);

    // Auto-select the newly added task title field
    setSelectedCell({ rowId: nextId, field: 'title' });
  };

  const handleDeleteSelectedRow = () => {
    if (!selectedCell) return;
    const rowIdToDelete = selectedCell.rowId;
    
    const updatedTasks = tasks.filter((t) => t.id !== rowIdToDelete);
    
    // Also clean up any styles attached to that deleted row
    const updatedStyles = { ...cellStyles };
    Object.keys(updatedStyles).forEach((key) => {
      if (key.startsWith(`${rowIdToDelete}:`)) {
        delete updatedStyles[key];
      }
    });

    setSelectedCell(null);
    setEditingCell(null);

    saveAndSyncSpreadsheet(updatedTasks, updatedStyles);
  };

  const handleApplyStyle = (styleToApply: Partial<CellStyle>) => {
    if (!selectedCell) return;
    const styleKey = `${selectedCell.rowId}:${selectedCell.field}`;
    const currentStyle = cellStyles[styleKey] || {};
    
    const updatedStyles = {
      ...cellStyles,
      [styleKey]: { ...currentStyle, ...styleToApply },
    };

    saveAndSyncSpreadsheet(tasks, updatedStyles);
  };

  const handleClearStyles = () => {
    if (!selectedCell) return;
    const styleKey = `${selectedCell.rowId}:${selectedCell.field}`;
    
    const updatedStyles = { ...cellStyles };
    delete updatedStyles[styleKey];

    saveAndSyncSpreadsheet(tasks, updatedStyles);
  };

  // --- 6. CSV Import / Export Logic ---
  const handleExportCSV = () => {
    // Column headers for CSV
    const csvHeaders = COLUMNS.map(col => col.label).join(',');
    
    // Map rows
    const csvRows = tasks.map((task) => {
      return COLUMNS.map((col) => {
        let val = task[col.field];
        // Handle values containing commas, wrapping them in double quotes
        if (typeof val === 'string' && (val.includes(',') || val.includes('\n') || val.includes('"'))) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',');
    });

    const csvContent = '\uFEFF' + [csvHeaders, ...csvRows].join('\n'); // Add UTF-8 BOM for Excel compatibility
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'planilha_de_tarefas_excel.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return; // Empty or headers only

      // Quick simple CSV line parser supporting double quotes
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let curVal = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(curVal.trim());
            curVal = '';
          } else {
            curVal += char;
          }
        }
        result.push(curVal.trim());
        return result;
      };

      const parsedTasks: Task[] = [];
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const cells = parseCSVLine(lines[i]);
        if (cells.length >= 8) {
          parsedTasks.push({
            id: cells[0] || `T-${100 + i}`,
            title: cells[1] || 'Importada s/ título',
            description: cells[2] || '',
            priority: (cells[3] as any) || 'Média',
            status: (cells[4] as any) || 'Não iniciada',
            deadline: cells[5] || '',
            assignee: cells[6] || 'Não atribuído',
            progress: Math.min(100, Math.max(0, parseInt(cells[7]) || 0)),
          });
        }
      }

      if (parsedTasks.length > 0) {
        setTasks(parsedTasks);
        localStorage.setItem('excel_tasks', JSON.stringify(parsedTasks));
        saveToHistory(parsedTasks, {});
        setSelectedCell(null);
        setEditingCell(null);
      }
    };
    reader.readAsText(file);
  };

  // --- 7. Formula Bar Value Mapping ---
  const activeCellValue = useMemo(() => {
    if (!selectedCell) return '';
    const task = tasks.find((t) => t.id === selectedCell.rowId);
    if (!task) return '';
    return String(task[selectedCell.field] ?? '');
  }, [selectedCell, tasks]);

  const activeCellCoordinate = useMemo(() => {
    if (!selectedCell) return '';
    const colIndex = COLUMNS.findIndex((c) => c.field === selectedCell.field);
    const colLetter = colIndex !== -1 ? COLUMNS[colIndex].letter : '';
    const rowIndex = tasks.findIndex((t) => t.id === selectedCell.rowId) + 1;
    return rowIndex > 0 ? `${colLetter}${rowIndex}` : '';
  }, [selectedCell, tasks]);

  const activeCellStyle = useMemo(() => {
    if (!selectedCell) return {};
    return cellStyles[`${selectedCell.rowId}:${selectedCell.field}`] || {};
  }, [selectedCell, cellStyles]);

  // --- 8. Sorting & Filtering Operations ---
  const handleSort = (field: TaskField) => {
    setSortBy((prev) => {
      if (prev.field === field) {
        if (prev.direction === 'asc') return { field, direction: 'desc' };
        return { field: null, direction: null }; // Reset
      }
      return { field, direction: 'asc' };
    });
  };

  const handleSetFilter = (field: TaskField, value: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (!value) delete next[field];
      else next[field] = value;
      return next;
    });
  };

  // Computes sorted & filtered tasks list
  const computedTasks = useMemo(() => {
    let result = [...tasks];

    // Apply column filters
    Object.keys(filters).forEach((fieldKey) => {
      const filterValue = filters[fieldKey];
      if (filterValue) {
        result = result.filter(
          (task) => String(task[fieldKey as TaskField]).toLowerCase() === filterValue.toLowerCase()
        );
      }
    });

    // Apply sorting
    if (sortBy.field && sortBy.direction) {
      const f = sortBy.field;
      const dir = sortBy.direction;

      result.sort((a, b) => {
        const valA = a[f];
        const valB = b[f];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return dir === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();

        return dir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return result;
  }, [tasks, sortBy, filters]);

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // --- 9. Bottom Tabs Config ---
  const tabs: SheetTab[] = [
    { id: 'tasks', label: 'Planilha de Tarefas' },
    { id: 'dashboard', label: 'Gráficos & Estatísticas' },
    { id: 'chat', label: 'Chat Integrado' },
    { id: 'help', label: 'Ajuda & Fórmulas' },
  ];
  if (currentUser.role === 'admin') {
    tabs.push({ id: 'users', label: 'Gestão de Usuários' });
  }

  return (
    <div id="excel-app-root" className="flex flex-col h-screen w-full bg-slate-200 overflow-hidden text-slate-800">
      {/* 1. Formatting & controls ribbon bar */}
      <Toolbar
        activeStyle={activeCellStyle}
        onApplyStyle={handleApplyStyle}
        onAddRow={handleAddRow}
        onDeleteSelectedRow={handleDeleteSelectedRow}
        onExportCSV={handleExportCSV}
        onImportCSV={handleImportCSV}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearStyles={handleClearStyles}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        hasSelection={!!selectedCell}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* 2. Spreadsheet Formula Bar */}
      <FormulaBar
        coordinate={activeCellCoordinate}
        value={activeCellValue}
        onChange={(newVal) => {
          if (selectedCell && selectedCell.field !== 'id') {
            // If editing progress, force bounds
            if (selectedCell.field === 'progress') {
              const parsedVal = Math.min(100, Math.max(0, parseInt(newVal) || 0));
              handleUpdateTask(selectedCell.rowId, selectedCell.field, parsedVal);
            } else {
              handleUpdateTask(selectedCell.rowId, selectedCell.field, newVal);
            }
          }
        }}
        disabled={!selectedCell || selectedCell.field === 'id'}
      />

      {/* 3. Main Worksheet View Switcher */}
      <div id="excel-main-content-area" className="flex-1 flex flex-col min-h-0 bg-white relative">
        {activeTab === 'tasks' ? (
          <SpreadsheetGrid
            tasks={computedTasks}
            onUpdateTask={handleUpdateTask}
            selectedCell={selectedCell}
            onSelectCell={setSelectedCell}
            cellStyles={cellStyles}
            editingCell={editingCell}
            onSetEditingCell={setEditingCell}
            searchTerm={searchTerm}
            sortBy={sortBy}
            onSort={handleSort}
            filters={filters}
            onSetFilter={handleSetFilter}
            onOpenDetail={setActiveDetailTaskId}
          />
        ) : activeTab === 'dashboard' ? (
          <DashboardSheet tasks={tasks} />
        ) : activeTab === 'users' && currentUser.role === 'admin' ? (
          <UserManagementSheet currentUser={currentUser} />
        ) : activeTab === 'chat' ? (
          <ChatSheet currentUser={currentUser} />
        ) : (
          <HelpSheet />
        )}

        {/* Task Detail View Overlay (absolute inset-0 to preserve spreadsheet scroll state underneath) */}
        {activeDetailTaskId && (
          <TaskDetailView
            taskId={activeDetailTaskId}
            tasks={tasks}
            onUpdateTask={handleUpdateTask}
            onClose={() => setActiveDetailTaskId(null)}
          />
        )}
      </div>

      {/* 4. Bottom Worksheet Navigation Tabs & Status Bar */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          setSelectedCell(null);
          setEditingCell(null);
        }}
        tasks={tasks}
      />
    </div>
  );
}
