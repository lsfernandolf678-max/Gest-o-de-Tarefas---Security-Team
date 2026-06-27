import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Mic, 
  Square, 
  Image as ImageIcon, 
  Paperclip, 
  Download, 
  Trash2, 
  Volume2, 
  Play, 
  Pause, 
  FileText, 
  CheckCheck, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { UserSession } from '../types';
import { ChatMessage, saveChatMessage, getAllChatMessages, clearChatHistory, ChatAttachment } from '../utils/chatDb';

interface ChatSheetProps {
  currentUser: UserSession;
}

export default function ChatSheet({ currentUser }: ChatSheetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Real-time synchronization channel
  const syncChannelRef = useRef<BroadcastChannel | null>(null);

  // Scroll ref
  const scrollRef = useRef<HTMLDivElement>(null);

  // File uploading state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  // Audio Playback states (for tracking custom active playing audios in the chat UI)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Error/Success visual tooltips
  const [feedbackError, setFeedbackError] = useState('');

  // 1. Load messages & initialize sync channel on mount
  useEffect(() => {
    loadHistory();

    // Poll server for new messages every 2 seconds
    const intervalId = window.setInterval(() => {
      loadHistory();
    }, 2000);

    // Create a BroadcastChannel for instantaneous multi-tab real-time communication
    try {
      const channel = new BroadcastChannel('security_team_chat_channel');
      channel.onmessage = (event) => {
        if (event.data === 'new-message' || event.data === 'clear-chat') {
          loadHistory();
        }
      };
      syncChannelRef.current = channel;
    } catch (e) {
      console.warn('BroadcastChannel não é suportado neste navegador. Sincronização multi-abas desativada.', e);
    }

    return () => {
      if (syncChannelRef.current) {
        syncChannelRef.current.close();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      clearInterval(intervalId);
    };
  }, []);

  // 2. Automatically scroll to bottom of the chat list
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadHistory = async () => {
    try {
      // Try to load from server first for multi-device sync
      const res = await fetch('/api/chat');
      if (res.ok) {
        const serverMessages = await res.json();
        
        // Sincroniza localmente com IndexedDB para backup offline
        for (const msg of serverMessages) {
          try {
            await saveChatMessage(msg);
          } catch (e) {
            // ignore duplicates or write errors
          }
        }
        
        // Evita re-render desnecessário se as mensagens forem iguais
        setMessages((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(serverMessages)) {
            return prev;
          }
          return serverMessages;
        });
        return;
      }
    } catch (err) {
      console.warn('Servidor offline ou inacessível. Carregando dados locais do IndexedDB...', err);
    }

    // Fallback local
    try {
      const hist = await getAllChatMessages();
      setMessages(hist);
    } catch (err) {
      console.error(err);
      setFeedbackError('Erro ao carregar histórico do chat.');
    }
  };

  const broadcastUpdate = (action: 'new-message' | 'clear-chat') => {
    if (syncChannelRef.current) {
      syncChannelRef.current.postMessage(action);
    }
  };

  // 3. Send Text Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText;
    setInputText('');

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      senderName: currentUser.name,
      senderUsername: currentUser.username,
      senderRole: currentUser.role,
      timestamp: Date.now(),
      text: textToSend
    };

    // Save locally first
    try {
      await saveChatMessage(newMsg);
    } catch (err) {}

    // Send to backend
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMsg),
      });
      await loadHistory();
      broadcastUpdate('new-message');
    } catch (err) {
      setFeedbackError('Ocorreu um erro ao sincronizar a mensagem com o servidor.');
    }
  };

  // 4. File processing (Converts files to Base64 to save inside IndexedDB)
  const processFile = async (file: File) => {
    setFeedbackError('');
    
    // Check file size limit (suggest under 15MB for responsive IndexedDB rendering)
    if (file.size > 15 * 1024 * 1024) {
      setFeedbackError('O arquivo excede o limite recomendado de 15MB para transferência.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      let type: 'audio' | 'image' | 'file' = 'file';

      if (file.type.startsWith('image/')) {
        type = 'image';
      } else if (file.type.startsWith('audio/')) {
        type = 'audio';
      }

      const attachment: ChatAttachment = {
        type,
        name: file.name,
        dataUrl,
        mimeType: file.type || 'application/octet-stream',
        size: file.size
      };

      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        senderName: currentUser.name,
        senderUsername: currentUser.username,
        senderRole: currentUser.role,
        timestamp: Date.now(),
        text: file.type.startsWith('image/') 
          ? `Enviou uma imagem: ${file.name}` 
          : file.type.startsWith('audio/') 
            ? `Enviou uma nota de voz` 
            : `Enviou um arquivo: ${file.name}`,
        attachment
      };

      try {
        await saveChatMessage(newMsg);
      } catch (err) {}

      try {
        await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newMsg),
        });
        await loadHistory();
        broadcastUpdate('new-message');
      } catch (err) {
        setFeedbackError('Falha ao enviar arquivo para o servidor de arquivos.');
      }
    };

    reader.onerror = () => {
      setFeedbackError('Erro ao ler conteúdo do arquivo.');
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // 5. Audio Recording logic (MediaRecorder)
  const startRecording = async () => {
    setFeedbackError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const options = { mimeType: 'audio/webm' };
      
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream); // Fallback if audio/webm is not supported
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        // Stop all tracks on the stream to release the microphone
        stream.getTracks().forEach(track => track.stop());

        // Process audio recording as file
        const file = new File([audioBlob], `Gravacao_Audio_${new Date().getTime()}.webm`, {
          type: recorder.mimeType
        });
        processFile(file);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // Get chunks every 250ms
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Falha ao acessar o microfone:', err);
      setFeedbackError('Não foi possível acessar o microfone. Verifique as permissões do seu navegador.');
    }
  };

  const stopRecording = (cancel: boolean = false) => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (cancel) {
        // Discard chunks and stop recorder without saving
        mediaRecorderRef.current.onstop = () => {
          if (mediaRecorderRef.current) {
            const stream = mediaRecorderRef.current.stream;
            stream.getTracks().forEach(track => track.stop());
          }
        };
      }
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // 6. Playback for voice audios inside the feed
  const togglePlayAudio = (id: string, dataUrl: string) => {
    if (playingAudioId === id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }

      const audio = new Audio(dataUrl);
      audio.onended = () => {
        setPlayingAudioId(null);
      };
      audio.onerror = () => {
        setFeedbackError('Erro ao reproduzir arquivo de áudio.');
        setPlayingAudioId(null);
      };

      audioPlayerRef.current = audio;
      audio.play();
      setPlayingAudioId(id);
    }
  };

  // 7. Clear whole history (Admins only)
  const handleClearHistory = async () => {
    if (currentUser.role !== 'admin') return;
    if (!window.confirm('Tem certeza de que deseja apagar permanentemente todo o histórico de mensagens e arquivos do chat?')) return;

    try {
      await clearChatHistory();
      await fetch('/api/chat/clear', { method: 'POST' });
      await loadHistory();
      broadcastUpdate('clear-chat');
    } catch (err) {
      setFeedbackError('Falha ao limpar o histórico do chat.');
    }
  };

  // Format bytes to readable string
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatSeconds = (totalSec: number): string => {
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="flex-1 flex flex-col min-h-0 bg-slate-900 select-none relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 1. Header Area */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-3 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-emerald-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-white font-sans flex items-center gap-1.5 leading-tight">
              Canal de Comunicação Integrado
            </h2>
            <p className="text-[10px] md:text-xs text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              Sala ativa para equipes do Security Team
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Admin Clean button */}
          {currentUser.role === 'admin' && (
            <button
              onClick={handleClearHistory}
              className="px-3 py-1.5 bg-rose-950/40 border border-rose-800 hover:bg-rose-900/60 text-rose-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Limpar histórico de mensagens"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpar Chat</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-1 text-[10px] text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800 font-mono">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            <span>Suporta arrastar arquivos</span>
          </div>
        </div>
      </div>

      {/* 2. Drag over overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm border-2 border-dashed border-emerald-500 flex flex-col items-center justify-center z-50 pointer-events-none animate-fade-in">
          <div className="bg-slate-900 p-6 rounded-2xl border border-emerald-500/30 flex flex-col items-center text-center space-y-3 shadow-2xl">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center animate-bounce">
              <Paperclip className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-emerald-100 font-bold text-sm">Arraste e solte o arquivo aqui</p>
            <p className="text-slate-400 text-xs">Imagens, áudios e qualquer outro documento de até 15MB</p>
          </div>
        </div>
      )}

      {/* 3. Message List Feed Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-4 min-h-0 bg-slate-950/40 relative scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center">
              <CheckCheck className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-slate-400 text-xs font-medium">Nenhuma mensagem enviada nesta sala ainda.</p>
            <p className="text-slate-600 text-[10px] max-w-xs">Use o campo de digitação abaixo, anexe arquivos ou grave áudios para iniciar a conversa.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderUsername === currentUser.username;
            const isAttachment = !!msg.attachment;

            return (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[85%] md:max-w-[70%] space-y-1 ${
                  isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                } animate-fade-in`}
              >
                {/* Meta details (Sender & Time) */}
                <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                  <span className="font-bold text-slate-300">{msg.senderName}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider ${
                    msg.senderRole === 'admin' 
                      ? 'bg-blue-950 text-blue-300 border border-blue-900/40' 
                      : 'bg-slate-900 text-slate-400'
                  }`}>
                    {msg.senderRole === 'admin' ? '🛡️ Admin' : '👥 Operador'}
                  </span>
                  <span>•</span>
                  <span>{formatTime(msg.timestamp)}</span>
                </div>

                {/* Bubble Container */}
                <div className={`p-3.5 rounded-2xl relative ${
                  isMe 
                    ? 'bg-emerald-900/95 text-emerald-50 border border-emerald-800/50 rounded-tr-none' 
                    : 'bg-slate-900/95 text-slate-200 border border-slate-800 rounded-tl-none'
                } shadow-md`}>
                  
                  {/* Message body text if it's not a standalone attachment with caption */}
                  {!isAttachment && (
                    <p className="text-xs md:text-sm font-sans leading-relaxed break-words whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  )}

                  {/* Render Custom Attachments */}
                  {isAttachment && msg.attachment && (
                    <div className="space-y-2">
                      {/* IMAGE ATTACHMENT */}
                      {msg.attachment.type === 'image' && (
                        <div className="space-y-1.5">
                          <div className="relative rounded-lg overflow-hidden border border-black/20 group max-h-[220px] md:max-h-[300px]">
                            <img 
                              src={msg.attachment.dataUrl} 
                              alt={msg.attachment.name}
                              referrerPolicy="no-referrer"
                              className="object-cover max-w-full h-auto cursor-zoom-in transition-transform duration-300 hover:scale-[1.02]"
                              onClick={() => {
                                // Full screen native browser image preview on click
                                const w = window.open();
                                if (w) {
                                  w.document.write(`<img src="${msg.attachment?.dataUrl}" style="max-width:100%; max-height:100%; display:block; margin:auto;"/>`);
                                  w.document.body.style.backgroundColor = '#0b0f19';
                                }
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                            <span className="truncate max-w-[150px] font-mono">{msg.attachment.name}</span>
                            <span className="shrink-0">{formatBytes(msg.attachment.size)}</span>
                          </div>
                        </div>
                      )}

                      {/* AUDIO RECORDING ATTACHMENT */}
                      {msg.attachment.type === 'audio' && (
                        <div className="flex items-center space-x-3 bg-black/20 px-3 py-2.5 rounded-xl border border-white/5 min-w-[200px] md:min-w-[240px]">
                          <button
                            onClick={() => togglePlayAudio(msg.id, msg.attachment!.dataUrl)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                              playingAudioId === msg.id 
                                ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            {playingAudioId === msg.id ? (
                              <Pause className="w-4 h-4 fill-white" />
                            ) : (
                              <Play className="w-4 h-4 fill-white translate-x-0.5" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-bold text-slate-300">Mensagem de Áudio</div>
                            <div className="text-[9px] text-slate-400 flex items-center gap-1 font-mono">
                              <Volume2 className="w-3 h-3 text-emerald-400" />
                              <span>{formatBytes(msg.attachment.size)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ARBITRARY FILE ATTACHMENT */}
                      {msg.attachment.type === 'file' && (
                        <div className="flex items-center justify-between gap-4 bg-black/15 px-3 py-2.5 rounded-xl border border-white/5 min-w-[180px] md:min-w-[220px]">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="w-8 h-8 bg-slate-800/80 rounded-lg flex items-center justify-center shrink-0 border border-slate-700">
                              <FileText className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-100 truncate pr-1" title={msg.attachment.name}>
                                {msg.attachment.name}
                              </div>
                              <div className="text-[9px] text-slate-400 font-mono">
                                {formatBytes(msg.attachment.size)}
                              </div>
                            </div>
                          </div>
                          
                          <a
                            href={msg.attachment.dataUrl}
                            download={msg.attachment.name}
                            className="w-7 h-7 bg-emerald-600/25 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-500 text-emerald-200 hover:text-white rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0"
                            title="Baixar arquivo"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Feedback Error Box if permission is missing */}
      {feedbackError && (
        <div className="bg-rose-950/90 border-t border-rose-800/50 px-6 py-2.5 flex items-center gap-2.5 text-xs text-rose-300 z-25 shrink-0 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <p className="font-semibold">{feedbackError}</p>
          <button 
            onClick={() => setFeedbackError('')} 
            className="ml-auto text-[10px] text-rose-400 hover:text-rose-200 cursor-pointer uppercase font-bold"
          >
            Fechar
          </button>
        </div>
      )}

      {/* 5. Active Voice Recorder Box Indicator */}
      {isRecording && (
        <div className="bg-emerald-950/90 border-t border-emerald-800/40 px-6 py-3 flex items-center justify-between z-20 shrink-0 animate-pulse">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
            <span className="text-xs font-bold text-emerald-200">GRAVANDO NOTA DE VOZ</span>
            <span className="text-xs font-mono bg-emerald-900 px-2 py-0.5 rounded text-emerald-300 font-semibold">
              {formatSeconds(recordingSeconds)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => stopRecording(true)} // Cancel
              className="px-3 py-1 bg-transparent hover:bg-rose-950/40 border border-transparent hover:border-rose-900/30 text-slate-400 hover:text-rose-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => stopRecording(false)} // Save
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              Parar e Enviar
            </button>
          </div>
        </div>
      )}

      {/* 6. Chat Input Action Controls Panel */}
      <div className="bg-slate-950 border-t border-slate-800 p-4 z-10 shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-5xl mx-auto">
          
          {/* Paperclip browse attachments */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecording}
            className="p-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-800 transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Anexar arquivo, imagem ou áudio"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            className="hidden" 
            accept="image/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
          />

          {/* Chat input box */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isRecording}
            placeholder={isRecording ? "Silêncio: gravando áudio..." : "Escreva sua mensagem aqui ou anexe arquivos..."}
            className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl py-3 px-4 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium disabled:opacity-60"
          />

          {/* Mic Recorder button */}
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="p-3 bg-slate-900 hover:bg-slate-800 text-emerald-500 hover:text-emerald-400 rounded-xl border border-slate-800 transition-all cursor-pointer flex items-center justify-center shrink-0"
              title="Gravar mensagem de áudio"
            >
              <Mic className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => stopRecording(false)}
              className="p-3 bg-rose-600 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 animate-pulse"
              title="Parar gravação de áudio"
            >
              <Square className="w-5 h-5 fill-white" />
            </button>
          )}

          {/* Send text button */}
          <button
            type="submit"
            disabled={isRecording || !inputText.trim()}
            className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-900 disabled:text-slate-600 text-white font-bold rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:border-slate-800 border border-transparent"
          >
            <Send className="w-5 h-5" />
          </button>

        </form>
      </div>

    </div>
  );
}
