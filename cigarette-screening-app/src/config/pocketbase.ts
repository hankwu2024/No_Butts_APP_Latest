import PocketBase from 'pocketbase';

export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8090' : '/'));

export const getUserId = (): string => {
  let id = localStorage.getItem('cigScreeningUserId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('cigScreeningUserId', id);
  }
  return id;
};
