/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X, RefreshCw, CheckCircle, AlertCircle, Info, ExternalLink, Mail, Search } from 'lucide-react';

interface EmailLog {
  id: string;
  sentAt: string;
  recipient: string;
  subject: string;
  status: 'Enviado' | 'Simulado' | 'Erro';
  task: {
    id: string;
    title: string;
    priority?: string;
    status?: string;
    assignee?: string;
    deadline?: string;
    progress?: number;
    description?: string;
    error?: string;
  };
}

interface EmailLogsModalProps {
  onClose: () => void;
}

export default function EmailLogsModal({ onClose }: EmailLogsModalProps) {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'Enviado' | 'Simulado' | 'Erro'>('todos');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/emails');
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setLogs(data);
        }
      }
    } catch (e) {
      console.error('Falha ao buscar logs de e-mail', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.task?.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.task?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.task?.assignee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || log.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[10000] p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Audit Trail de Notificações por E-mail</h2>
              <p className="text-xs text-slate-400">Destinatário obrigatório: <span className="font-semibold text-emerald-400">L.FPINHO@BTP.COM.BR</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Notice about Environment Configuration */}
        <div className="bg-emerald-50 border-b border-emerald-100 p-4 shrink-0 flex items-start gap-3">
          <Info className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <div className="text-xs text-emerald-800 leading-relaxed">
            <span className="font-bold">Como funciona:</span> Sempre que uma tarefa for adicionada à planilha, o servidor envia automaticamente um e-mail. Se as chaves de SMTP (<code className="font-mono bg-emerald-100/80 px-1 rounded">SMTP_HOST</code>, <code className="font-mono bg-emerald-100/80 px-1 rounded">SMTP_USER</code>, <code className="font-mono bg-emerald-100/80 px-1 rounded">SMTP_PASS</code>) não estiverem presentes no arquivo <code className="font-mono bg-emerald-100/80 px-1 rounded">.env</code>, o e-mail é simulado com sucesso e logado nesta auditoria para validação de layout e fluxo.
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código, título, responsável ou assunto..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <select
              className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
            >
              <option value="todos">Todos os Status</option>
              <option value="Enviado">Enviado (Real)</option>
              <option value="Simulado">Simulado (Preview)</option>
              <option value="Erro">Falha no Envio</option>
            </select>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Content Split Pane */}
        <div className="flex-1 flex min-h-0 bg-slate-100">
          {/* Logs List Pane */}
          <div className="w-1/2 border-r border-slate-200 overflow-y-auto bg-white flex flex-col">
            {filteredLogs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Mail className="w-12 h-12 stroke-1 text-slate-300 mb-2" />
                <p className="text-xs font-semibold">Nenhuma notificação enviada ainda.</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">Insira uma nova linha de tarefa na planilha para disparar o e-mail de notificação para L.FPINHO@BTP.COM.BR.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const isSelected = selectedLog?.id === log.id;
                  return (
                    <button
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`w-full text-left p-4 transition-all flex flex-col gap-2 border-l-4 cursor-pointer hover:bg-slate-50 ${
                        isSelected 
                          ? 'bg-emerald-50/50 border-l-emerald-600' 
                          : log.status === 'Enviado' 
                            ? 'border-l-emerald-500' 
                            : log.status === 'Simulado' 
                              ? 'border-l-indigo-500' 
                              : 'border-l-rose-500'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {log.task?.id || 'NOVO'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.sentAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      
                      <div className="font-semibold text-xs text-slate-800 line-clamp-1">
                        {log.task?.title || 'Sem título'}
                      </div>
                      
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <span className="text-[10px] text-slate-500 font-mono">
                          Para: {log.recipient}
                        </span>
                        
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0 ${
                          log.status === 'Enviado' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : log.status === 'Simulado' 
                              ? 'bg-indigo-100 text-indigo-800' 
                              : 'bg-rose-100 text-rose-800'
                        }`}>
                          {log.status === 'Enviado' ? (
                            <>
                              <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Enviado</span>
                            </>
                          ) : log.status === 'Simulado' ? (
                            <>
                              <Info className="w-2.5 h-2.5 text-indigo-600" />
                              <span>Simulado</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                              <span>Falha</span>
                            </>
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details Pane */}
          <div className="w-1/2 overflow-y-auto p-6 bg-slate-50 flex flex-col">
            {selectedLog ? (
              <div className="flex flex-col gap-5">
                {/* Log Header info */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Metadados de Envio</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">STATUS</span>
                      <span className={`font-bold inline-block mt-0.5 ${
                        selectedLog.status === 'Enviado' ? 'text-emerald-700' : 
                        selectedLog.status === 'Simulado' ? 'text-indigo-700' : 'text-rose-700'
                      }`}>
                        {selectedLog.status === 'Enviado' ? 'Real (SMTP)' : 
                         selectedLog.status === 'Simulado' ? 'Simulado (Preview)' : 'Erro de Conexão'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">DATA/HORA</span>
                      <span className="text-slate-700 font-mono font-medium block mt-0.5">
                        {new Date(selectedLog.sentAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="col-span-2 border-t border-slate-100 pt-2">
                      <span className="text-slate-400 block text-[10px]">DESTINATÁRIO OFICIAL</span>
                      <span className="text-slate-800 font-mono font-bold block mt-0.5">{selectedLog.recipient}</span>
                    </div>
                    <div className="col-span-2 border-t border-slate-100 pt-2">
                      <span className="text-slate-400 block text-[10px]">ASSUNTO DO E-MAIL</span>
                      <span className="text-slate-800 font-medium block mt-0.5">{selectedLog.subject}</span>
                    </div>
                  </div>
                </div>

                {/* Task metadata detail */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Conteúdo da Tarefa Anexada</h3>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">ID da Tarefa:</span>
                      <span className="font-mono font-bold text-slate-900">{selectedLog.task?.id}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Título:</span>
                      <span className="font-semibold text-slate-900 text-right max-w-[200px] truncate">{selectedLog.task?.title}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Prioridade:</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        selectedLog.task?.priority === 'Alta' ? 'bg-rose-100 text-rose-800' :
                        selectedLog.task?.priority === 'Média' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>{selectedLog.task?.priority || 'Baixa'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Responsável:</span>
                      <span className="text-slate-800 font-medium">{selectedLog.task?.assignee || 'Não designado'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Prazo Máximo:</span>
                      <span className="text-slate-700 font-mono">{selectedLog.task?.deadline || 'Não definido'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Progresso:</span>
                      <span className="text-emerald-700 font-mono font-bold">{selectedLog.task?.progress || 0}%</span>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-slate-500">Descrição:</span>
                      <p className="bg-slate-50 p-2 rounded text-[11px] text-slate-600 leading-relaxed max-h-[100px] overflow-y-auto border border-slate-150">
                        {selectedLog.task?.description || 'Nenhuma descrição fornecida.'}
                      </p>
                    </div>

                    {selectedLog.status === 'Erro' && selectedLog.task?.error && (
                      <div className="mt-2 bg-rose-50 text-rose-800 border border-rose-200 rounded p-2.5 flex items-start gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-[10px] uppercase">Mensagem de Erro SMTP:</p>
                          <p className="font-mono text-[10px] mt-0.5">{selectedLog.task.error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Preview Template */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="bg-slate-200 px-4 py-2 flex items-center justify-between text-[11px] font-bold text-slate-600 shrink-0">
                    <span>VISUALIZAÇÃO DO EMAIL ENVIADO (HTML)</span>
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="p-3 bg-white max-h-[220px] overflow-y-auto border-t border-slate-200">
                    <div className="border border-slate-100 rounded p-3 scale-[0.9] origin-top text-[12px] leading-relaxed">
                      <div className="font-bold text-emerald-800 pb-2 border-b border-emerald-100">⚠️ Nova Tarefa Adicionada</div>
                      <p className="mt-2 text-slate-700">Olá <strong>Luís Pinho</strong>,</p>
                      <p className="text-slate-600">Uma nova tarefa foi cadastrada na planilha compartilhada por um membro da equipe:</p>
                      <ul className="list-disc pl-4 text-slate-600 mt-1 space-y-0.5">
                        <li>Código: <strong>{selectedLog.task?.id}</strong></li>
                        <li>Título: {selectedLog.task?.title}</li>
                        <li>Prioridade: {selectedLog.task?.priority || 'Baixa'}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-6">
                <Info className="w-10 h-10 text-slate-300 stroke-1 mb-2 animate-pulse" />
                <p className="text-xs font-semibold">Nenhum registro selecionado</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[240px]">Selecione um e-mail na lista lateral para auditar o conteúdo da notificação, metadados de rede, status SMTP e corpo da mensagem.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
