import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Automatically append trailing slash if not present (ignoring query parameters)
  if (config.url) {
    const [path, query] = config.url.split('?');
    if (!path.endsWith('/')) {
      config.url = `${path}/${query ? '?' + query : ''}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isAuthEndpoint = err.config?.url?.includes('/auth/');
      const isLoginPage = window.location.pathname === '/login';
      if (!isAuthEndpoint && !isLoginPage) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
