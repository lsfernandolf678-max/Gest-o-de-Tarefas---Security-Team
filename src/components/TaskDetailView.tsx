import React, { useState } from 'react';
import { ArrowLeft, Save, MessageSquare, Send, Calendar, User, Clock, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { Task, TaskComment, PriorityType, StatusType, TaskField } from '../types';
import { PRIORITIES, STATUSES, ASSIGNEES } from '../constants';

const formatDateToBR = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

interface TaskDetailViewProps {
  taskId: string;
  tasks: Task[];
  onUpdateTask: (id: string, field: TaskField, value: any) => void;
  onClose: () => void;
}

export default function TaskDetailView({ taskId, tasks, onUpdateTask, onClose }: TaskDetailViewProps) {
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    return (
      <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-700">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold">Tarefa não encontrada</h3>
        <p className="text-sm text-slate-500 mt-1">O ID especificado não foi localizado.</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium text-sm transition-colors"
        >
          Voltar para Planilha
        </button>
      </div>
    );
  }

  // Local state for adding a comment
  const [commentAuthor, setCommentAuthor] = useState<string>(task.assignee || 'Luís Fernando');
  const [commentText, setCommentText] = useState('');

  // Add Comment handler
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: TaskComment = {
      id: `C-${Date.now()}`,
      author: commentAuthor,
      text: commentText.trim(),
      timestamp: new Date().toISOString(), // Local or ISO
    };

    const currentComments = task.comments || [];
    const updatedComments = [...currentComments, newComment];
    onUpdateTask(task.id, 'comments', updatedComments);
    setCommentText('');
  };

  // Status indicator colors
  const statusBadgeStyle = (status: StatusType) => {
    const styles = {
      'Não iniciada': 'bg-slate-100 text-slate-700 border-slate-200',
      'Iniciada': 'bg-sky-50 text-sky-700 border-sky-200',
      'Em andamento - 1': 'bg-blue-50 text-blue-700 border-blue-200',
      'Em andamento - 2 (quase finalizado)': 'bg-amber-50 text-amber-800 border-amber-200',
      'Concluído': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
    return styles[status] || 'bg-slate-100 text-slate-700';
  };

  const priorityBadgeStyle = (priority: PriorityType) => {
    const styles = {
      'Alta': 'bg-rose-50 text-rose-700 border-rose-200',
      'Média': 'bg-amber-50 text-amber-700 border-amber-200',
      'Baixa': 'bg-slate-50 text-slate-600 border-slate-200',
    };
    return styles[priority] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col h-full overflow-hidden">
      {/* Detail Header */}
      <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-emerald-700 text-emerald-100 hover:text-white transition-colors"
            title="Voltar para a planilha"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-900 text-emerald-200 text-xs font-bold px-2 py-0.5 rounded font-mono">
                ID: {task.id}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusBadgeStyle(task.status)}`}>
                {task.status}
              </span>
            </div>
            <h1 className="text-lg font-bold tracking-tight mt-0.5 truncate max-w-xl">
              {task.title}
            </h1>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center space-x-1.5"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Concluir e Voltar</span>
        </button>
      </div>

      {/* Main Detail Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
          
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Informações da Tarefa
              </h2>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Título da Tarefa</label>
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => onUpdateTask(task.id, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 hover:bg-slate-50/50 transition-colors text-sm font-medium"
                  />
                </div>

                {/* Grid for small fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                    <select
                      value={task.status}
                      onChange={(e) => onUpdateTask(task.id, 'status', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-sm font-medium"
                    >
                      {STATUSES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Prioridade</label>
                    <select
                      value={task.priority}
                      onChange={(e) => onUpdateTask(task.id, 'priority', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-sm font-medium"
                    >
                      {PRIORITIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  {/* Assignee */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Responsável</label>
                    <select
                      value={task.assignee}
                      onChange={(e) => onUpdateTask(task.id, 'assignee', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-sm font-medium"
                    >
                      {ASSIGNEES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  {/* Deadline */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Prazo de Entrega</label>
                    <input
                      type="date"
                      value={task.deadline}
                      onChange={(e) => onUpdateTask(task.id, 'deadline', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-sm font-medium font-mono"
                    />
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-500">Progresso (%)</label>
                    <span className="text-xs font-bold text-emerald-600 font-mono">{task.progress}%</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="25"
                      value={task.progress}
                      onChange={(e) => onUpdateTask(task.id, 'progress', parseInt(e.target.value))}
                      className="flex-1 accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={task.progress}
                      onChange={(e) => onUpdateTask(task.id, 'progress', e.target.value)}
                      className="w-16 px-2 py-1 text-center border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 text-xs font-mono font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    * O progresso é sincronizado em blocos (Não iniciada: 0%, Iniciada: 25%, Em andamento - 1: 50%, Em andamento - 2: 75%, Concluído: 100%).
                  </p>
                </div>

                {/* Detailed Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Descrição Detalhada</label>
                  <textarea
                    rows={4}
                    value={task.description}
                    onChange={(e) => onUpdateTask(task.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-sm"
                    placeholder="Adicione uma descrição detalhada sobre as etapas, riscos ou escopo da tarefa..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Comments & History */}
          <div className="lg:col-span-5 h-full flex flex-col space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col max-h-[600px] lg:max-h-[calc(100vh-180px)]">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 shrink-0">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Comentários & Histórico
              </h2>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 border-b border-slate-100 pb-4 min-h-[200px]">
                {!task.comments || task.comments.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs">Nenhum comentário adicionado ainda.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Seja o primeiro a documentar uma atualização para esta tarefa!</p>
                  </div>
                ) : (
                  task.comments.map((comment) => {
                    const initials = comment.author ? comment.author.charAt(0) : '?';
                    return (
                      <div key={comment.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex gap-3 text-xs">
                        <div className="w-7 h-7 bg-emerald-100 text-emerald-800 font-bold rounded-full flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700">{comment.author}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(comment.timestamp).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="space-y-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="text-[10px] font-bold text-slate-400 shrink-0 uppercase">Autor:</div>
                  <select
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    className="flex-1 text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {ASSIGNEES.map(user => (
                      <option key={user} value={user}>{user}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escreva um comentário sobre o progresso..."
                    className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="absolute right-2 bottom-2.5 p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm"
                    title="Enviar comentário"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
