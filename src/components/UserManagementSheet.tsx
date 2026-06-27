import React, { useState } from 'react';
import { Shield, ShieldAlert, Key, UserCheck, AlertCircle, CheckCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { getUsersList, saveStoredRole, saveStoredPassword, ManagedUser } from '../utils/userDb';
import { UserSession } from '../types';

interface UserManagementSheetProps {
  currentUser: UserSession;
  onUserUpdate?: () => void;
}

export default function UserManagementSheet({ currentUser, onUserUpdate }: UserManagementSheetProps) {
  const [users, setUsers] = useState<ManagedUser[]>(() => getUsersList());
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const refreshList = () => {
    setUsers(getUsersList());
    if (onUserUpdate) onUserUpdate();
  };

  const handleRoleChange = (username: string, newRole: 'admin' | 'user') => {
    setErrorMsg('');
    setSuccessMsg('');

    if (username === currentUser.username && newRole !== 'admin') {
      setErrorMsg('Você não pode revogar seu próprio privilégio de Administrador para evitar bloqueio de acesso.');
      return;
    }

    saveStoredRole(username, newRole);
    refreshList();
    setSuccessMsg(`O nível de poder de ${username} foi alterado para ${newRole === 'admin' ? 'Administrador' : 'Operador'} com sucesso.`);
    
    // Clear message after 3s
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handlePasswordChangeSubmit = (username: string) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPasswordVal.trim()) {
      setErrorMsg('A nova senha não pode estar vazia.');
      return;
    }

    if (newPasswordVal.trim().length < 4) {
      setErrorMsg('A senha deve conter pelo menos 4 caracteres.');
      return;
    }

    saveStoredPassword(username, newPasswordVal.trim());
    setNewPasswordVal('');
    setEditingUsername(null);
    refreshList();
    setSuccessMsg(`A senha do usuário ${username} foi atualizada com sucesso.`);
    
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="flex-1 p-6 bg-slate-50 overflow-y-auto select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Block */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 font-sans flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-700 fill-emerald-50" />
              Gestão de Usuários - Security Team
            </h2>
            <p className="text-slate-500 text-xs">
              Como administrador, você pode gerenciar as senhas de acesso e os níveis de poder de todos os membros da equipe de segurança.
            </p>
          </div>
          <button
            onClick={() => {
              refreshList();
              setSuccessMsg('Lista de usuários atualizada.');
              setTimeout(() => setSuccessMsg(''), 2000);
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar Lista
          </button>
        </div>

        {/* Alert Messages */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5 leading-normal animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="font-semibold">{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 leading-normal animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="font-semibold">{errorMsg}</p>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Membros Ativos do Sistema ({users.length})
            </span>
            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
              Área Administrativa
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30">
                  <th className="py-3 px-5">Nome do Membro</th>
                  <th className="py-3 px-5">Usuário / Login</th>
                  <th className="py-3 px-5">Nível de Poder</th>
                  <th className="py-3 px-5">Status da Senha</th>
                  <th className="py-3 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {users.map((user) => {
                  const isSelf = user.username === currentUser.username;
                  const isEditing = editingUsername === user.username;

                  return (
                    <tr key={user.username} className={`hover:bg-slate-50/50 transition-colors ${isSelf ? 'bg-emerald-50/10' : ''}`}>
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-5 font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shadow-sm uppercase ${
                            user.role === 'admin' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{user.name}</span>
                            {isSelf && <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wide">Sua Conta</span>}
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3.5 px-5 font-mono text-slate-600 font-semibold">
                        {user.username}
                      </td>

                      {/* Power Level / Role */}
                      <td className="py-3.5 px-5">
                        <div className="relative inline-block w-36">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.username, e.target.value as 'admin' | 'user')}
                            disabled={isSelf} // Self role protection
                            className={`w-full appearance-none pl-3 pr-8 py-1.5 border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-all ${
                              user.role === 'admin'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100/70'
                            } ${isSelf ? 'opacity-85 cursor-not-allowed' : ''}`}
                          >
                            <option value="user">👥 Operador</option>
                            <option value="admin">🛡️ Administrador</option>
                          </select>
                          {!isSelf && (
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                              <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Password Status */}
                      <td className="py-3.5 px-5">
                        {user.hasCustomPassword ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            Personalizada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wider" title="O usuário ainda usa a senha padrão e mudará no primeiro login">
                            <Key className="w-3 h-3 text-amber-600" />
                            Senha Padrão
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <div className="relative">
                              <input
                                type={showPass ? 'text' : 'password'}
                                value={newPasswordVal}
                                onChange={(e) => setNewPasswordVal(e.target.value)}
                                placeholder="Nova senha"
                                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-36 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {showPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                            <button
                              onClick={() => handlePasswordChangeSubmit(user.username)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => {
                                setEditingUsername(null);
                                setNewPasswordVal('');
                              }}
                              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-all cursor-pointer"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingUsername(user.username);
                              setNewPasswordVal('');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                            Alterar Senha
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Informative Help Card */}
        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-5 text-xs text-slate-600 leading-relaxed space-y-2">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            Políticas de Segurança do Portal
          </h4>
          <ul className="list-disc pl-4 space-y-1 text-slate-600">
            <li>As senhas alteradas entram em vigor instantaneamente. O usuário afetado precisará usar a nova senha em sua próxima autenticação.</li>
            <li>Quando um operador tem seu nível elevado para <strong>Administrador</strong>, ele ganha permissões de exclusão de tarefas, importação de planilhas de arquivos CSV e gerência de outros membros.</li>
            <li>Qualquer senha padrão <code className="font-mono bg-slate-200/60 px-1 rounded text-slate-800">1qaz2wsx</code> exige a troca obrigatória pelo operador no momento do primeiro acesso.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
