import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.setupInterceptors();
  }

  setupInterceptors() {
    axios.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  async login(username, password) {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username,
      password
    });
    
    const { token, user } = response.data;
    this.token = token;
    localStorage.setItem('authToken', token);
    
    return { user, token };
  }

  async register(userData) {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    const { token, user } = response.data;
    
    this.token = token;
    localStorage.setItem('authToken', token);
    
    return { user, token };
  }

  async verifyToken() {
    const response = await axios.get(`${API_URL}/auth/verify`);
    return response.data.user;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  }

  isAuthenticated() {
    return !!this.token;
  }
}

export const authService = new AuthService();