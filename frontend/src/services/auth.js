import api from './api';

/**
 * Register a new user.
 * @param {{ name: string, email: string, password: string }} payload
 * @returns {Promise<{ token: string, user: object }>}
 */
export const register = (payload) =>
  api.post('/auth/register', payload).then((r) => r.data);

/**
 * Log in an existing user.
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<{ token: string, user: object }>}
 */
export const login = (payload) =>
  api.post('/auth/login', payload).then((r) => r.data);

/** Persist JWT to localStorage. */
export const saveToken = (token) => localStorage.setItem('medpulsex_token', token);

/** Retrieve JWT from localStorage. */
export const getToken = () => localStorage.getItem('medpulsex_token');

/** Remove JWT (logout). */
export const removeToken = () => localStorage.removeItem('medpulsex_token');
