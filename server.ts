/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const SPREADSHEET_FILE = path.join(DATA_DIR, 'spreadsheet.json');
const CHAT_FILE = path.join(DATA_DIR, 'chat.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Fallback spreadsheet initial tasks
const DEFAULT_TASKS = [
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

// Helper to load spreadsheet state
function loadSpreadsheet() {
  if (fs.existsSync(SPREADSHEET_FILE)) {
    try {
      const data = fs.readFileSync(SPREADSHEET_FILE, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Erro ao ler spreadsheet.json', e);
    }
  }
  return { tasks: DEFAULT_TASKS, cellStyles: {} };
}

// Helper to save spreadsheet state
function saveSpreadsheet(data: any) {
  try {
    fs.writeFileSync(SPREADSHEET_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Erro ao escrever em spreadsheet.json', e);
  }
}

// Helper to load chat messages
function loadChat() {
  if (fs.existsSync(CHAT_FILE)) {
    try {
      const data = fs.readFileSync(CHAT_FILE, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Erro ao ler chat.json', e);
    }
  }
  return [];
}

// Helper to save chat messages
function saveChat(messages: any[]) {
  try {
    fs.writeFileSync(CHAT_FILE, JSON.stringify(messages, null, 2), 'utf8');
  } catch (e) {
    console.error('Erro ao escrever em chat.json', e);
  }
}

async function startServer() {
  const app = express();

  // Increase limit for audio/image attachments
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- API Routes ---

  // 1. Get current spreadsheet tasks & cell styles
  app.get('/api/spreadsheet', (req, res) => {
    const data = loadSpreadsheet();
    res.json(data);
  });

  // 2. Update spreadsheet tasks & cell styles
  app.post('/api/spreadsheet', (req, res) => {
    const { tasks, cellStyles } = req.body;
    if (!tasks) {
      return res.status(400).json({ error: 'Faltando campo "tasks"' });
    }
    const newData = {
      tasks,
      cellStyles: cellStyles || {}
    };
    saveSpreadsheet(newData);
    res.json({ success: true, message: 'Planilha salva com sucesso!' });
  });

  // 3. Get chat messages
  app.get('/api/chat', (req, res) => {
    const messages = loadChat();
    res.json(messages);
  });

  // 4. Add a new chat message
  app.post('/api/chat', (req, res) => {
    const message = req.body;
    if (!message || !message.id) {
      return res.status(400).json({ error: 'Formato de mensagem inválido' });
    }
    const messages = loadChat();
    messages.push(message);
    saveChat(messages);
    res.json({ success: true, message: 'Mensagem adicionada com sucesso!' });
  });

  // 5. Clear chat messages
  app.post('/api/chat/clear', (req, res) => {
    saveChat([]);
    res.json({ success: true, message: 'Chat limpo com sucesso!' });
  });

  // --- Vite & Frontend Static Serving ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
