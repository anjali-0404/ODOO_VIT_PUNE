import axios from 'axios';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  managerId?: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface SignupPayload {
  companyName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface ExpensePayload {
  description: string;
  expenseDate: string;
  category: string;
  amount: number;
  currency: string;
  receiptUrl?: string;
}

export interface ExpenseResponse {
  id: number;
  employeeId?: number;
  employeeEmail?: string;
  description: string;
  expenseDate: string;
  category: string;
  amount: number;
  currency: string;
  status: string;
  receiptUrl?: string;
}

export interface ApprovalResponse {
  id: number;
  stepOrder: number;
  currentStep: boolean;
  requiredRole?: string;
  approverId?: number;
  decision: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  decisionAt?: string;
}

export interface AppUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  managerId?: number;
  companyId?: number;
  active?: boolean;
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'FINANCE' | 'DIRECTOR' | 'CFO';
  managerId?: number;
}

export interface ApprovalRule {
  id: number;
  name: string;
  minAmount?: number;
  maxAmount?: number;
  requiredApprovalPercentage?: number;
  autoApproveRole?: string;
  active: boolean;
}

export interface CreateApprovalRulePayload {
  name: string;
  minAmount?: number;
  maxAmount?: number;
  requiredApprovalPercentage?: number;
  autoApproveRole?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'FINANCE' | 'DIRECTOR' | 'CFO';
  active?: boolean;
}

export interface UpdateApprovalRulePayload {
  name?: string;
  minAmount?: number;
  maxAmount?: number;
  requiredApprovalPercentage?: number;
  autoApproveRole?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'FINANCE' | 'DIRECTOR' | 'CFO';
  active?: boolean;
}

export interface CurrencyConversionResponse {
  from: string;
  to: string;
  originalAmount: number;
  convertedAmount: number;
  exchangeRate: number;
}

export interface ExpenseHistoryResponse {
  id: number;
  action: string;
  performedBy?: number;
  performedByName?: string;
  timestamp: string;
  comment?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PagedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface AuthTokenResponse {
  accessToken: string;
}

interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  role: string;
  managerId?: number;
}

const TOKEN_KEY = 'token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearAuthToken();
      localStorage.removeItem('user');

      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    return Promise.reject(error);
  }
);

const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.message as string | undefined;
    return responseMessage || error.message || 'Request failed';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
};

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const { data } = await api.post<ApiResponse<AuthTokenResponse>>('/auth/login', {
      email: normalizedEmail,
      password,
    });
    if (!data?.data?.accessToken) {
      throw new Error('Login response is missing access token');
    }
    setAuthToken(data.data.accessToken);
    return { accessToken: data.data.accessToken };
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const signupCompanyAdmin = async (payload: SignupPayload): Promise<void> => {
  try {
    await api.post('/auth/signup', payload);
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const getMe = async (): Promise<ApiUser> => {
  try {
    const { data } = await api.get<ApiResponse<UserResponse>>('/auth/me');
    return {
      id: String(data.data.id),
      name: data.data.fullName,
      email: data.data.email,
      role: data.data.role,
      managerId: data.data.managerId ? String(data.data.managerId) : undefined,
    };
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const getMyExpenses = async (): Promise<ExpenseResponse[]> => {
  try {
    const { data } = await api.get<ApiResponse<PagedResponse<ExpenseResponse>>>('/expenses/my');
    return data.data.items;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const listUsers = async (page = 0, size = 100): Promise<AppUser[]> => {
  try {
    const { data } = await api.get<ApiResponse<PagedResponse<AppUser>>>(`/users?page=${page}&size=${size}`);
    return data.data.items;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const createUser = async (payload: CreateUserPayload): Promise<AppUser> => {
  try {
    const { data } = await api.post<ApiResponse<AppUser>>('/users', payload);
    return data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const listApprovalRules = async (): Promise<ApprovalRule[]> => {
  try {
    const { data } = await api.get<ApiResponse<ApprovalRule[]>>('/rules');
    return data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const createApprovalRule = async (payload: CreateApprovalRulePayload): Promise<ApprovalRule> => {
  try {
    const { data } = await api.post<ApiResponse<ApprovalRule>>('/rules', payload);
    return data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const updateApprovalRule = async (ruleId: number, payload: UpdateApprovalRulePayload): Promise<ApprovalRule> => {
  try {
    const { data } = await api.put<ApiResponse<ApprovalRule>>(`/rules/${ruleId}`, payload);
    return data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const convertCurrencyAmount = async (from: string, to: string, amount: number): Promise<CurrencyConversionResponse> => {
  try {
    const { data } = await api.get<ApiResponse<CurrencyConversionResponse>>('/currency/convert', {
      params: { from, to, amount },
    });
    return data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const createExpense = async (payload: ExpensePayload): Promise<ExpenseResponse> => {
  try {
    const requestBody = {
      amount: payload.amount,
      currency: payload.currency,
      category: payload.category,
      description: payload.description,
      expenseDate: payload.expenseDate,
    };

    const { data } = await api.post<ApiResponse<ExpenseResponse>>('/expenses', requestBody);
    return data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const getPendingApprovals = async (): Promise<ExpenseResponse[]> => {
  try {
    const { data } = await api.get<ApiResponse<PagedResponse<ExpenseResponse>>>('/approvals/pending');
    return data.data.items;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const getExpenseById = async (expenseId: string): Promise<ExpenseResponse> => {
  try {
    const { data } = await api.get<ApiResponse<ExpenseResponse>>(`/expenses/${expenseId}`);
    return data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const getExpenseApprovals = async (expenseId: string): Promise<ApprovalResponse[]> => {
  try {
    const { data } = await api.get<ApiResponse<ApprovalResponse[]>>(`/approvals/${expenseId}`);
    return data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const getExpenseHistory = async (expenseId: string): Promise<ExpenseHistoryResponse[]> => {
  try {
    const { data } = await api.get<ApiResponse<ExpenseHistoryResponse[]>>(`/expenses/${expenseId}/history`);
    return data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const approveExpense = async (expenseId: string, comment?: string): Promise<void> => {
  try {
    await api.put(`/approvals/${expenseId}/approve`, { comment });
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export const rejectExpense = async (expenseId: string, comment?: string): Promise<void> => {
  try {
    await api.put(`/approvals/${expenseId}/reject`, { comment });
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

export default api;
