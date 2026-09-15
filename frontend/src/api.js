const FALLBACK_API_URL = 'https://ebanikpi-api1.onrender.com';

const apiBaseUrl = (import.meta.env.VITE_API_URL || FALLBACK_API_URL).replace(/\/$/, '');

export const apiFetch = (path, options) => {
  return fetch(`${apiBaseUrl}${path}`, options);
};