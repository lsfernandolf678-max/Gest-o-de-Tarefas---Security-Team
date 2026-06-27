/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ColumnConfig, Task } from './types';

export const COLUMNS: ColumnConfig[] = [
  { field: 'id', label: 'Cód', letter: 'A', width: 'w-16 min-w-[64px]', type: 'text' },
  { field: 'title', label: 'Tarefa / Título', letter: 'B', width: 'w-64 min-w-[240px]', type: 'text' },
  { field: 'description', label: 'Descrição Detalhada', letter: 'C', width: 'w-96 min-w-[320px]', type: 'text' },
  { field: 'priority', label: 'Prioridade', letter: 'D', width: 'w-32 min-w-[120px]', type: 'select' },
  { field: 'status', label: 'Status', letter: 'E', width: 'w-56 min-w-[180px]', type: 'select' },
  { field: 'deadline', label: 'Prazo', letter: 'F', width: 'w-36 min-w-[130px]', type: 'date' },
  { field: 'assignee', label: 'Responsável', letter: 'G', width: 'w-44 min-w-[160px]', type: 'select' },
  { field: 'progress', label: 'Progresso (%)', letter: 'H', width: 'w-32 min-w-[110px]', type: 'number' },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'T-101',
    title: 'Desenhar layout da planilha',
    priority: 'Alta',
    status: 'Concluído',
    deadline: '2026-06-28',
    assignee: 'Luís Fernando',
    progress: 100,
    description: 'Criar uma interface fidedigna ao Excel, com colunas, barra de fórmulas, navegação por teclado e paleta de cores verde clássica.'
  },
  {
    id: 'T-102',
    title: 'Configurar barra de fórmulas',
    priority: 'Alta',
    status: 'Em andamento - 1',
    deadline: '2026-06-30',
    assignee: 'Luiza Freitas',
    progress: 50,
    description: 'Implementar o campo de texto superior (fx) sincronizado com a célula ativa para exibição e edição rápida do conteúdo.'
  },
  {
    id: 'T-103',
    title: 'Adicionar filtros e ordenação',
    priority: 'Média',
    status: 'Não iniciada',
    deadline: '2026-07-02',
    assignee: 'Leonardo Soares',
    progress: 0,
    description: 'Permitir que o usuário clique no cabeçalho das colunas para ordenar (Crescente/Decrescente) ou filtrar tarefas específicas por prioridade/status.'
  },
  {
    id: 'T-104',
    title: 'Desenvolver aba de Gráficos',
    priority: 'Média',
    status: 'Em andamento - 2 (quase finalizado)',
    deadline: '2026-07-05',
    assignee: 'Giovanna Santos',
    progress: 75,
    description: 'Criar uma tela de dashboard analítico nativo de planilha que sintetiza as métricas da lista de tarefas de forma visual (gráficos em SVG).'
  },
  {
    id: 'T-105',
    title: 'Ajustar validação de prazo retroativo',
    priority: 'Baixa',
    status: 'Iniciada',
    deadline: '2026-06-25',
    assignee: 'Isabela Freitas',
    progress: 25,
    description: 'Adicionar alertas visuais ou regras para prazos vencidos. Atualmente bloqueado esperando aprovação das regras de negócio pela gerência.'
  },
  {
    id: 'T-106',
    title: 'Exportação para formato CSV/Excel',
    priority: 'Média',
    status: 'Não iniciada',
    deadline: '2026-07-10',
    assignee: 'Emanoelly Veiga',
    progress: 0,
    description: 'Desenvolver rotina de exportação no formato de valores separados por vírgula para permitir importação em planilhas locais.'
  }
];

export const PRESET_BG_COLORS = [
  { class: 'bg-white', label: 'Sem preenchimento', border: 'border-slate-300' },
  { class: 'bg-red-100', label: 'Vermelho Claro', border: 'border-red-200' },
  { class: 'bg-orange-100', label: 'Laranja Claro', border: 'border-orange-200' },
  { class: 'bg-yellow-100', label: 'Amarelo Claro', border: 'border-yellow-200' },
  { class: 'bg-green-100', label: 'Verde Claro', border: 'border-green-200' },
  { class: 'bg-blue-100', label: 'Azul Claro', border: 'border-blue-200' },
  { class: 'bg-purple-100', label: 'Roxo Claro', border: 'border-purple-200' },
  { class: 'bg-slate-100', label: 'Cinza Claro', border: 'border-slate-200' },
];

export const PRESET_TEXT_COLORS = [
  { class: 'text-slate-900', label: 'Preto Padrão' },
  { class: 'text-red-700', label: 'Vermelho Escuro' },
  { class: 'text-orange-700', label: 'Laranja Escuro' },
  { class: 'text-yellow-700', label: 'Amarelo Escuro' },
  { class: 'text-green-700', label: 'Verde Escuro' },
  { class: 'text-blue-700', label: 'Azul Escuro' },
  { class: 'text-purple-700', label: 'Roxo Escuro' },
  { class: 'text-slate-500', label: 'Cinza Escuro' },
];

export const PRIORITIES = ['Alta', 'Média', 'Baixa'] as const;
export const STATUSES = [
  'Não iniciada',
  'Iniciada',
  'Em andamento - 1',
  'Em andamento - 2 (quase finalizado)',
  'Concluído'
] as const;

export const ASSIGNEES = [
  'Não atribuído',
  'Luiza Freitas',
  'Luís Fernando',
  'Leonardo Soares',
  'Giovanna Santos',
  'Isabela Freitas',
  'Emanoelly Veiga'
] as const;
