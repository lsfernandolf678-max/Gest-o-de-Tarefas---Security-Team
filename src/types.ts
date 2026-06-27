/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PriorityType = 'Alta' | 'Média' | 'Baixa';
export type StatusType = 
  | 'Não iniciada' 
  | 'Iniciada' 
  | 'Em andamento - 1' 
  | 'Em andamento - 2 (quase finalizado)' 
  | 'Concluído';

export interface TaskComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  priority: PriorityType;
  status: StatusType;
  deadline: string;
  description: string;
  progress: number; // 0 to 100
  assignee: string;
  comments?: TaskComment[];
}

export type TaskField = keyof Task;

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  bgColor?: string; // Tailwind bg class or hex
  textColor?: string; // Tailwind text class or hex
  align?: 'left' | 'center' | 'right';
}

export interface CellSelection {
  rowId: string;
  field: TaskField;
}

export interface SheetTab {
  id: 'tasks' | 'dashboard' | 'help' | 'users' | 'chat';
  label: string;
}

export interface UserSession {
  username: string;
  role: 'admin' | 'user';
  name: string;
}

export interface ColumnConfig {
  field: TaskField;
  label: string;
  letter: string; // Excel-style column letter (A, B, C, D...)
  width: string; // Tailwind width class or css value
  type: 'text' | 'select' | 'date' | 'number';
}
