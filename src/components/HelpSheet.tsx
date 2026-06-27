/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookOpen, Command, HelpCircle, Keyboard, RefreshCw, Smartphone } from 'lucide-react';

export default function HelpSheet() {
  return (
    <div className="flex-1 bg-slate-100 p-4 md:p-6 overflow-y-auto select-none font-sans">
      {/* Title */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 mb-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-700" />
          Guia do Usuário & Atalhos Excel
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Aprenda a interagir e extrair o máximo de performance desta planilha de tarefas interativa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Navigation Section */}
        <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
            <Keyboard className="w-4 h-4" />
            Navegação Teclado (Fidelidade)
          </h3>
          <ul className="space-y-3.5 text-xs text-slate-600">
            <li className="flex items-start justify-between gap-2">
              <span>Mover seleção de célula:</span>
              <span className="bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] shrink-0 text-slate-800">
                Setas (↑, ↓, ←, →)
              </span>
            </li>
            <li className="flex items-start justify-between gap-2">
              <span>Mover para direita:</span>
              <span className="bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] shrink-0 text-slate-800">
                Tab
              </span>
            </li>
            <li className="flex items-start justify-between gap-2">
              <span>Mover para esquerda:</span>
              <span className="bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] shrink-0 text-slate-800">
                Shift + Tab
              </span>
            </li>
            <li className="flex items-start justify-between gap-2">
              <span>Editar célula selecionada:</span>
              <span className="bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] shrink-0 text-slate-800">
                F2 ou Enter
              </span>
            </li>
            <li className="flex items-start justify-between gap-2">
              <span>Salvar edição de célula:</span>
              <span className="bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] shrink-0 text-slate-800">
                Enter
              </span>
            </li>
            <li className="flex items-start justify-between gap-2">
              <span>Cancelar edição atual:</span>
              <span className="bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] shrink-0 text-slate-800">
                Esc
              </span>
            </li>
            <li className="flex items-start justify-between gap-2">
              <span>Limpar conteúdo da célula:</span>
              <span className="bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] shrink-0 text-slate-800">
                Delete ou Backspace
              </span>
            </li>
          </ul>
        </div>

        {/* Feature list */}
        <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
            <Command className="w-4 h-4" />
            Recursos da Planilha
          </h3>
          <ul className="space-y-3 text-xs text-slate-600 list-disc pl-4">
            <li>
              <strong className="text-slate-800">Edição Multiformato</strong>: Suporte nativo a dropdowns de Prioridade e Status, seletores de prazo por Calendário e campos de número de progresso (0-100%).
            </li>
            <li>
              <strong className="text-slate-800">Barra de Fórmulas (fx)</strong>: Mostra as coordenadas dinâmicas da célula em foco e permite alterações em tempo real de texto longo ou dados.
            </li>
            <li>
              <strong className="text-slate-800">Formatação de Cores e Estilo</strong>: Personalize fonte em Negrito, Itálico, Sublinhado e preenchimento de célula (Cores de Fundo de Categoria).
            </li>
            <li>
              <strong className="text-slate-800">Filtros Avançados</strong>: Filtre instantaneamente as linhas clicando nos funis (<strong className="text-emerald-700">⚙</strong>) presentes no cabeçalho das colunas.
            </li>
            <li>
              <strong className="text-slate-800">Ordenação Automática</strong>: Ordene as tarefas por qualquer campo clicando nos botões de seta na parte superior da coluna.
            </li>
          </ul>
        </div>

        {/* File management & tips */}
        <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
            <RefreshCw className="w-4 h-4" />
            Sincronização & Dicas
          </h3>
          <div className="space-y-4 text-xs text-slate-600">
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded text-emerald-900 leading-relaxed">
              <strong className="font-bold block mb-1">💡 Dica de Excel:</strong>
              Para alterar rapidamente as cores ou o alinhamento de uma célula, basta selecioná-la com um clique e usar a fita superior (Toolbar). Os estilos serão mantidos!
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-800">Como importar/exportar:</h4>
              <p className="leading-relaxed text-slate-500">
                Você pode baixar seu plano completo de tarefas clicando em <strong className="text-slate-700">"Exportar CSV"</strong>. Se quiser carregar tarefas existentes, use um arquivo CSV compatível no botão de <strong className="text-slate-700">"Importar"</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile support alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6 text-xs text-amber-900 flex items-center gap-3">
        <Smartphone className="w-5 h-5 shrink-0 text-amber-600" />
        <div>
          <strong className="font-bold">Interação Mobile</strong>: Se estiver usando celular ou tablet, dê um duplo clique rápido na célula para abrir o menu suspenso ou teclado virtual apropriado. Use as abas inferiores para circular entre a planilha e os relatórios visuais.
        </div>
      </div>
    </div>
  );
}
