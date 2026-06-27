import { UserSession } from '../types';

export interface ManagedUser {
  username: string;
  name: string;
  role: 'admin' | 'user';
  hasCustomPassword: boolean;
}

// Initial hardcoded list of users
const DEFAULT_USERS: { username: string; name: string; defaultRole: 'admin' | 'user' }[] = [
  { username: 'L.SOARES', name: 'Leonardo Soares', defaultRole: 'admin' },
  { username: 'L.FPINHO', name: 'Luís Pinho', defaultRole: 'admin' },
  { username: 'L.FREITAS', name: 'Luiza Freitas', defaultRole: 'user' },
  { username: 'F.CARVALHO', name: 'Fabio Carvalho', defaultRole: 'user' },
];

export const getStoredRoles = (): Record<string, 'admin' | 'user'> => {
  try {
    const saved = localStorage.getItem('security_team_user_roles');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    console.error('Falha ao ler funções do localStorage', e);
    return {};
  }
};

export const saveStoredRole = (username: string, role: 'admin' | 'user') => {
  try {
    const roles = getStoredRoles();
    roles[username] = role;
    localStorage.setItem('security_team_user_roles', JSON.stringify(roles));
  } catch (e) {
    console.error('Falha ao salvar função no localStorage', e);
  }
};

export const getStoredPasswords = (): Record<string, string> => {
  try {
    const saved = localStorage.getItem('security_team_custom_passwords');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    console.error('Falha ao obter senhas do localStorage', e);
    return {};
  }
};

export const saveStoredPassword = (username: string, pass: string) => {
  try {
    const passwords = getStoredPasswords();
    passwords[username] = pass;
    localStorage.setItem('security_team_custom_passwords', JSON.stringify(passwords));
  } catch (e) {
    console.error('Falha ao salvar senha no localStorage', e);
  }
};

export const getUsersList = (): ManagedUser[] => {
  const customRoles = getStoredRoles();
  const customPasswords = getStoredPasswords();

  return DEFAULT_USERS.map((user) => {
    let role = customRoles[user.username] || user.defaultRole;
    if (user.username === 'L.SOARES' || user.username === 'L.FPINHO') {
      role = 'admin';
    }
    const hasCustomPassword = !!customPasswords[user.username];
    return {
      username: user.username,
      name: user.name,
      role,
      hasCustomPassword,
    };
  });
};
