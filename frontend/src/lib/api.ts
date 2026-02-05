import axios from 'axios';
import { AuthResponse, Category, Wallet, Transaction, Budget, DashboardSummary, TransactionListResponse, Goal, User, RecurringTransaction, GoalItem, FinancialScoreResponse, GamificationStatus, MonthlyReport, Debt } from '@/types/definitions';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
console.log('🔌 API Base URL:', API_BASE_URL); // Debugging line

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Auth API
export const authApi = {
    register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
        const { data } = await api.post('/auth/register', { name, email, password });
        return data;
    },
    login: async (name: string, password: string): Promise<AuthResponse> => {
        const { data } = await api.post('/auth/login', { name, password });
        return data;
    },
    googleAuth: async (googleData: { email: string; name: string; avatar_url: string; google_id: string }): Promise<AuthResponse> => {
        const { data } = await api.post('/auth/google', googleData);
        return data;
    },
    updateProfile: async (name: string, avatar_url: string): Promise<User> => {
        const { data } = await api.put('/auth/me/profile', { name, avatar_url });
        return data;
    },
    changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
        await api.put('/auth/me/password', { old_password: oldPassword, new_password: newPassword });
    },
    getMe: async () => {
        const { data } = await api.get('/auth/me');
        return data;
    },
};

export const dataApi = {
    export: async (): Promise<Blob> => {
        const { data } = await api.get('/data/export', { responseType: 'blob' });
        return data;
    },
    import: async (file: File): Promise<void> => {
        const formData = new FormData();
        formData.append('file', file);
        await api.post('/data/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

// Wallets API
export const walletsApi = {
    list: async (): Promise<Wallet[]> => {
        const { data } = await api.get('/wallets');
        return data;
    },
    get: async (id: number): Promise<Wallet> => {
        const { data } = await api.get(`/wallets/${id}`);
        return data;
    },
    create: async (wallet: Partial<Wallet>): Promise<Wallet> => {
        const { data } = await api.post('/wallets', wallet);
        return data;
    },
    update: async (id: number, wallet: Partial<Wallet>): Promise<Wallet> => {
        const { data } = await api.put(`/wallets/${id}`, wallet);
        return data;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/wallets/${id}`);
    },
};

// Categories API
export const categoriesApi = {
    list: async (type?: string): Promise<Category[]> => {
        const { data } = await api.get('/categories', { params: { type } });
        return data;
    },
    get: async (id: number): Promise<Category> => {
        const { data } = await api.get(`/categories/${id}`);
        return data;
    },
    create: async (category: Partial<Category>): Promise<Category> => {
        const { data } = await api.post('/categories', category);
        return data;
    },
    update: async (id: number, category: Partial<Category>): Promise<Category> => {
        const { data } = await api.put(`/categories/${id}`, category);
        return data;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/categories/${id}`);
    },
};

// Transactions API
export const transactionsApi = {
    list: async (page = 1, limit = 20, filters?: any): Promise<TransactionListResponse> => {
        const params = { page, limit, ...filters };
        const { data } = await api.get('/transactions', { params });
        return data;
    },
    get: async (id: number): Promise<Transaction> => {
        const { data } = await api.get(`/transactions/${id}`);
        return data;
    },
    create: async (transaction: Partial<Transaction>): Promise<Transaction> => {
        const { data } = await api.post('/transactions', transaction);
        return data;
    },
    update: async (id: number, transaction: Partial<Transaction>): Promise<Transaction> => {
        const { data } = await api.put(`/transactions/${id}`, transaction);
        return data;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/transactions/${id}`);
    },
    transfer: async (payload: { source_wallet_id: number; target_wallet_id: number; amount: number; description: string; date: string }): Promise<void> => {
        await api.post('/transactions/transfer', payload);
    },
};

// Budgets API
export const budgetsApi = {
    list: async (month?: number, year?: number): Promise<Budget[]> => {
        const params: any = {};
        if (month) params.month = month;
        if (year) params.year = year;
        const { data } = await api.get('/budgets', { params });
        return data;
    },
    get: async (id: number): Promise<Budget> => {
        const { data } = await api.get(`/budgets/${id}`);
        return data;
    },
    create: async (budget: Partial<Budget>): Promise<Budget> => {
        const { data } = await api.post('/budgets', budget);
        return data;
    },
    update: async (id: number, budget: Partial<Budget>): Promise<Budget> => {
        const { data } = await api.put(`/budgets/${id}`, budget);
        return data;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/budgets/${id}`);
    },
};

// Goals API
export const goalsApi = {
    list: async (): Promise<Goal[]> => {
        const { data } = await api.get('/goals');
        return data;
    },
    create: async (goal: Partial<Goal>): Promise<Goal> => {
        const { data } = await api.post('/goals', goal);
        return data;
    },
    update: async (id: number, goal: Partial<Goal>): Promise<Goal> => {
        const { data } = await api.put(`/goals/${id}`, goal);
        return data;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/goals/${id}`);
    },
    addMember: async (id: number, email: string): Promise<void> => {
        await api.post(`/goals/${id}/members`, { email });
    },
    addFunds: async (id: number, amount: number, notes: string, date: string): Promise<void> => {
        await api.post(`/goals/${id}/funds`, { amount, notes, date });
    },
    getHistory: async (id: number): Promise<any[]> => {
        const { data } = await api.get(`/goals/${id}/history`);
        return data;
    },

    getItems: async (id: number): Promise<GoalItem[]> => {
        const { data } = await api.get(`/goals/${id}/items`);
        return data;
    },
    addItem: async (id: number, payload: Partial<GoalItem>): Promise<GoalItem> => {
        const { data } = await api.post(`/goals/${id}/items`, payload);
        return data;
    },
    updateItem: async (itemID: number, payload: Partial<GoalItem>): Promise<GoalItem> => {
        const { data } = await api.put(`/goals/items/${itemID}`, payload);
        return data;
    },
    deleteItem: async (itemID: number): Promise<void> => {
        await api.delete(`/goals/items/${itemID}`);
    },
};

export const recurringApi = {
    list: async (): Promise<RecurringTransaction[]> => {
        const { data } = await api.get('/recurring');
        return data;
    },
    create: async (payload: Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<RecurringTransaction> => {
        const { data } = await api.post('/recurring', payload);
        return data;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/recurring/${id}`);
    },
};

// Dashboard API
export const dashboardApi = {
    getSummary: async (period = 'monthly'): Promise<DashboardSummary> => {
        const { data } = await api.get(`/dashboard/summary?period=${period}`);
        return data;
    },
};

export const analyticsApi = {
    getScore: async (): Promise<FinancialScoreResponse> => {
        const { data } = await api.get('/analytics/score');
        return data;
    },
};

export const gamificationApi = {
    getStatus: async (): Promise<GamificationStatus> => {
        const { data } = await api.get('/gamification/status');
        return data;
    },
};

export const reportsApi = {
    getMonthly: async (year: number, month: number): Promise<MonthlyReport> => {
        const { data } = await api.get('/reports/monthly', { params: { year, month } });
        return data;
    },
};

export const uploadApi = {
    upload: async (file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    },
};

export const debtApi = {
    getAll: async (type?: 'payable' | 'receivable') => {
        const params = type ? { type } : {};
        const response = await api.get<Debt[]>('/debts', { params });
        return response.data;
    },
    create: async (data: Omit<Debt, 'ID' | 'user_id' | 'created_at' | 'updated_at'>) => {
        const response = await api.post<Debt>('/debts', data);
        return response.data;
    },
    update: async (id: number, data: Partial<Debt>) => {
        const response = await api.put<Debt>(`/debts/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        await api.delete(`/debts/${id}`);
    },
};

export default api;

