/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const SPREADSHEET_FILE = path.join(DATA_DIR, 'spreadsheet.json');
const CHAT_FILE = path.join(DATA_DIR, 'chat.json');
const EMAILS_LOG_FILE = path.join(DATA_DIR, 'emails.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to load email logs
function loadEmailLogs() {
  if (fs.existsSync(EMAILS_LOG_FILE)) {
    try {
      const data = fs.readFileSync(EMAILS_LOG_FILE, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Erro ao ler emails.json', e);
    }
  }
  return [];
}

// Helper to save email log entry
function saveEmailLog(logEntry: any) {
  try {
    const logs = loadEmailLogs();
    logs.unshift(logEntry); // newest first
    // keep last 100 email logs
    if (logs.length > 100) {
      logs.length = 100;
    }
    fs.writeFileSync(EMAILS_LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
  } catch (e) {
    console.error('Erro ao salvar em emails.json', e);
  }
}

// Notification Email Dispatcher
async function sendTaskNotificationEmail(task: any) {
  const recipient = 'L.FPINHO@BTP.COM.BR';
  const subject = `⚠️ Nova Tarefa Adicionada: [${task.id}] ${task.title}`;
  
  const textBody = `
Olá Luís Pinho,

Uma nova tarefa foi adicionada à Planilha de Equipe de Segurança:

• Código: ${task.id}
• Título: ${task.title}
• Prioridade: ${task.priority || 'Não definida'}
• Status: ${task.status || 'Não iniciada'}
• Responsável: ${task.assignee || 'Não designado'}
• Prazo: ${task.deadline || 'Não definido'}
• Progresso: ${task.progress || 0}%

Descrição:
${task.description || 'Nenhuma descrição fornecida.'}

Atenciosamente,
Sistema de Notificação de Planilha BTP
`;

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc;">
      <div style="background-color: #059669; padding: 16px; border-radius: 6px 6px 0 0; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 600;">⚠️ Nova Tarefa Adicionada</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Planilha de Controle de Equipe BTP</p>
      </div>
      <div style="padding: 24px; background-color: white; border-radius: 0 0 6px 6px;">
        <p style="font-size: 14px; color: #334155; margin-top: 0;">Olá <strong>Luís Pinho</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">Uma nova tarefa foi cadastrada na planilha compartilhada por um membro da equipe:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b; width: 120px;">Código</td>
            <td style="padding: 10px 0; color: #0f172a; font-family: monospace; font-weight: bold; font-size: 14px;">${task.id}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Título</td>
            <td style="padding: 10px 0; color: #0f172a; font-weight: 500;">${task.title}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Prioridade</td>
            <td style="padding: 10px 0;">
              <span style="padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px; ${
                task.priority === 'Alta' ? 'background-color: #fff1f2; color: #e11d48;' : 
                task.priority === 'Média' ? 'background-color: #fef3c7; color: #d97706;' : 
                'background-color: #ecfdf5; color: #059669;'
              }">${task.priority || 'Baixa'}</span>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Status</td>
            <td style="padding: 10px 0; color: #334155; font-weight: 500;">${task.status || 'Não iniciada'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Responsável</td>
            <td style="padding: 10px 0; color: #334155;">${task.assignee || 'Não designado'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Prazo</td>
            <td style="padding: 10px 0; color: #334155; font-family: monospace;">${task.deadline || 'Não definido'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Progresso</td>
            <td style="padding: 10px 0; color: #059669; font-weight: bold; font-family: monospace;">${task.progress || 0}%</td>
          </tr>
        </table>
        
        <div style="background-color: #f8fafc; padding: 14px; border-radius: 6px; border-left: 3px solid #cbd5e1; margin-bottom: 24px;">
          <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748b;">Descrição da Tarefa</p>
          <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">${task.description || 'Nenhuma descrição fornecida.'}</p>
        </div>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 16px;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          Este é um e-mail automático gerado pelo Sistema de Planilha Compartilhada BTP.
        </p>
      </div>
    </div>
  `;

  const logEntry = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sentAt: new Date().toISOString(),
    recipient,
    subject,
    task,
    status: 'Simulado'
  };

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || '587'),
        secure: smtpPort === '465',
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL || '"Planilha BTP" <notificador-planilha@btp.com.br>',
        to: recipient,
        subject: subject,
        text: textBody,
        html: htmlBody
      });

      console.log(`Email enviado com sucesso para ${recipient}: ${info.messageId}`);
      logEntry.status = 'Enviado';
      saveEmailLog(logEntry);
    } catch (error: any) {
      console.error(`Erro ao enviar email para ${recipient}:`, error);
      logEntry.status = 'Erro';
      logEntry.task = { ...task, error: error.message };
      saveEmailLog(logEntry);
    }
  } else {
    console.log(`[Email Simulado] Enviando para: ${recipient}`);
    console.log(`[Assunto] ${subject}`);
    console.log(`[Conteúdo]`, textBody);
    console.log(`-> Para enviar e-mails reais, configure SMTP_HOST, SMTP_USER e SMTP_PASS no ambiente.`);
    saveEmailLog(logEntry);
  }
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

    // Read previous spreadsheet tasks to detect new additions
    const oldData = loadSpreadsheet();
    const oldTasks = oldData.tasks || [];
    const oldTaskIds = new Set(oldTasks.map((t: any) => t.id));

    // Find if there are newly added tasks
    const newlyAddedTasks = tasks.filter((t: any) => !oldTaskIds.has(t.id));

    const newData = {
      tasks,
      cellStyles: cellStyles || {}
    };
    saveSpreadsheet(newData);

    // Trigger emails asynchronously so it doesn't block the API response
    if (newlyAddedTasks.length > 0) {
      for (const newTask of newlyAddedTasks) {
        // Send email to L.FPINHO@BTP.COM.BR
        sendTaskNotificationEmail(newTask).catch(err => {
          console.error('Erro em sendTaskNotificationEmail:', err);
        });
      }
    }

    res.json({ 
      success: true, 
      message: 'Planilha salva com sucesso!',
      newlyAddedCount: newlyAddedTasks.length
    });
  });

  // 2.5 Get email notification logs for auditing
  app.get('/api/emails', (req, res) => {
    res.json(loadEmailLogs());
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
