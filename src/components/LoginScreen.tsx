import React, { useState } from 'react';
import { Shield, Lock, User, Eye, EyeOff, AlertTriangle, Key } from 'lucide-react';
import { UserSession } from '../types';
import { getUsersList, getStoredPasswords, saveStoredPassword } from '../utils/userDb';

interface LoginScreenProps {
  onLogin: (session: UserSession) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  // Navigation states
  const [step, setStep] = useState<'login' | 'change_password'>('login');
  const [pendingUser, setPendingUser] = useState<UserSession | null>(null);

  // Form input states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password reset states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);

    // Simulate small latency for premium security feeling
    setTimeout(() => {
      const normalizedUser = username.trim().toUpperCase();
      const enteredPass = password.trim();

      // Check dynamic user definitions
      const allUsers = getUsersList();
      const matchedManaged = allUsers.find(u => u.username === normalizedUser);

      if (!matchedManaged) {
        setError('Usuário não cadastrado. Verifique suas credenciais de acesso.');
        setLoading(false);
        return;
      }

      const matchedUser: UserSession = {
        username: matchedManaged.username,
        role: matchedManaged.role,
        name: matchedManaged.name
      };

      // Check correct password
      const customPasswords = getStoredPasswords();
      const hasCustomPass = !!customPasswords[normalizedUser];
      const correctPass = hasCustomPass ? customPasswords[normalizedUser] : '1qaz2wsx';

      if (enteredPass !== correctPass) {
        setError('Senha de acesso incorreta para este usuário.');
        setLoading(false);
        return;
      }

      // Authentication succeeded!
      // Now check first-access requirement for non-admin users
      if (matchedUser.role !== 'admin' && !hasCustomPass) {
        // First access! Must change password
        setPendingUser(matchedUser);
        setStep('change_password');
        setError('');
        setLoading(false);
      } else {
        // Direct login
        onLogin(matchedUser);
        setLoading(false);
      }
    }, 600);
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Por favor, preencha a nova senha e a confirmação.');
      return;
    }

    if (newPassword.length < 4) {
      setError('A nova senha deve conter pelo menos 4 caracteres.');
      return;
    }

    if (newPassword === '1qaz2wsx') {
      setError('A nova senha deve ser diferente da senha padrão (1qaz2wsx).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas digitadas não coincidem. Por favor, tente novamente.');
      return;
    }

    if (!pendingUser) {
      setError('Sessão expirada. Volte para a tela de login.');
      setStep('login');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Save password and log user in
      saveStoredPassword(pendingUser.username, newPassword);
      onLogin(pendingUser);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background ambient light effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-2xl p-8 shadow-2xl relative z-10 transition-all duration-300 hover:border-emerald-500/30">
        
        {/* Top Icon and Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 relative group">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <Shield className="w-8 h-8 text-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight font-sans">
            Security Team
          </h1>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider font-semibold">
            Portal de Gestão de Tarefas
          </p>
          <div className="h-0.5 w-12 bg-emerald-500/50 mt-3 rounded-full" />
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-xs text-rose-300 leading-normal">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {step === 'login' ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Usuário / Login
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  autoFocus
                  disabled={loading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: L.SOARES"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium uppercase tracking-wide"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Senha de Acesso
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-950/40 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </div>
              ) : (
                <span>Entrar no Painel</span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordChangeSubmit} className="space-y-5 animate-fade-in">
            {/* Warning Info Box */}
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 leading-normal">
              <p className="font-bold mb-1">🛡️ Primeiro Acesso Detectado</p>
              <p className="text-slate-300">
                Olá, <span className="font-semibold text-emerald-200">{pendingUser?.name}</span>. Por motivos de segurança, você deve alterar sua senha padrão para continuar.
              </p>
            </div>

            {/* New Password Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Nova Senha de Acesso
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  autoFocus
                  disabled={loading}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nova senha secreta"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Confirmar Nova Senha
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="space-y-2.5">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-950/40 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Salvando nova senha...</span>
                  </div>
                ) : (
                  <span>Salvar Senha e Entrar</span>
                )}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setStep('login');
                  setPendingUser(null);
                  setError('');
                }}
                className="w-full py-2 px-4 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Voltar ao Login
              </button>
            </div>
          </form>
        )}

        {/* Credentials hints (optional but helper to facilitate testing for reviewer or user) */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <p className="text-[10px] text-slate-500">
            Acesso restrito para pessoal do Security Team.
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-slate-600 mt-6 tracking-wide text-center">
        Sistemas de Informação Integrados &copy; {new Date().getFullYear()} Security Team. Todos os direitos reservados.
      </p>
    </div>
  );
}
