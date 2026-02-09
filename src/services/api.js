import axios from 'axios';

// Use environment variable for API URL, fallback to '/api' for local dev with proxy
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// Items API
export const itemsAPI = {
  getAll: (params) => api.get('/items', { params }),
  getOne: (id) => api.get(`/items/${id}`),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
  getLowStock: () => api.get('/items/low-stock'),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getOne: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Transactions API
export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  getByItem: (itemId) => api.get(`/transactions/item/${itemId}`),
};

// Requests API
export const requestsAPI = {
  getAll: (params) => api.get('/requests', { params }),
  getOne: (id) => api.get(`/requests/${id}`),
  create: (data) => api.post('/requests', data),
  update: (id, data) => api.put(`/requests/${id}`, data),
  delete: (id) => api.delete(`/requests/${id}`),
  approve: (id) => api.put(`/requests/${id}/approve`),
  reject: (id, data) => api.put(`/requests/${id}/reject`, data),
  approveItem: (requestId, itemId) => api.put(`/requests/${requestId}/items/${itemId}/approve`),
  rejectItem: (requestId, itemId, data) => api.put(`/requests/${requestId}/items/${itemId}/reject`, data),
};

// Documents API
export const documentsAPI = {
  generateInventoryReport: async (params) => {
    const response = await axios.post(`${API_URL}/documents/inventory-report`, params, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      responseType: 'blob',
    });
    return response.data;
  },
  generateLowStockAlert: async () => {
    const response = await axios.post(`${API_URL}/documents/low-stock-alert`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      responseType: 'blob',
    });
    return response.data;
  },
  generateTransactionReport: async (params) => {
    const response = await axios.post(`${API_URL}/documents/transaction-report`, params, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      responseType: 'blob',
    });
    return response.data;
  },
  generateItemLabel: async (itemId) => {
    const response = await axios.post(`${API_URL}/documents/item-label/${itemId}`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      responseType: 'blob',
    });
    return response.data;
  },
};

// Excel API
export const excelAPI = {
  exportInventoryReport: async (params) => {
    const response = await axios.post(`${API_URL}/excel/inventory-report`, params, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      responseType: 'blob',
    });
    return response.data;
  },
  exportLowStockAlert: async () => {
    const response = await axios.post(`${API_URL}/excel/low-stock-alert`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      responseType: 'blob',
    });
    return response.data;
  },
  exportTransactionReport: async (params) => {
    const response = await axios.post(`${API_URL}/excel/transaction-report`, params, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      responseType: 'blob',
    });
    return response.data;
  },
  exportFullData: async () => {
    const response = await axios.post(`${API_URL}/excel/full-export`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      responseType: 'blob',
    });
    return response.data;
  },
};

// RIS (Requisition and Issue Slip) API
export const risAPI = {
  generateRIS: async (requestId) => {
    const response = await axios.post(`${API_URL}/ris/generate/${requestId}`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      responseType: 'blob',
    });
    return response.data;
  },
  generateRISBatch: async (requestIds) => {
    const response = await axios.post(`${API_URL}/ris/generate-batch`, 
      { requestIds }, 
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        responseType: 'blob',
      }
    );
    return response.data;
  },
  generateCustomRIS: async (data) => {
    const response = await axios.post(`${API_URL}/ris/generate-custom`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      responseType: 'blob',
    });
    return response.data;
  },
  previewTemplate: async () => {
    const response = await axios.get(`${API_URL}/ris/preview-template`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  },
};

export default api;
