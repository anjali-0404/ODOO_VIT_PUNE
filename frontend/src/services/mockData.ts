// Mock data store using localStorage for full frontend simulation
// This replaces the backend, making all pages fully functional

export interface Expense {
  id: string;
  employee: string;
  employeeEmail: string;
  description: string;
  date: string;
  category: string;
  paidBy: string;
  remarks: string;
  amount: number;
  currency: string;
  convertedAmount?: number;
  companyCurrency?: string;
  status: 'Draft' | 'Submitted' | 'Waiting Approval' | 'Approved' | 'Rejected';
  receiptUrl?: string;
  approverTrail: ApproverAction[];
  createdAt: string;
}

export interface ApproverAction {
  approver: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  time?: string;
  comment?: string;
}

export interface ApprovalRule {
  id: string;
  userId: string;
  userName: string;
  description: string;
  managerId: string;
  managerName: string;
  isManagerApprover: boolean;
  approvers: RuleApprover[];
  isSequential: boolean;
  minApprovalPercentage: number;
}

export interface RuleApprover {
  userId: string;
  userName: string;
  isRequired: boolean;
  order: number;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Employee' | 'Finance' | 'CFO';
  managerId?: string;
  managerName?: string;
}

// ----- EXPENSE HELPERS -----
const EXPENSES_KEY = 'mock_expenses';

export const getExpenses = (): Expense[] => {
  const raw = localStorage.getItem(EXPENSES_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const getExpensesByEmployee = (email: string): Expense[] => {
  return getExpenses().filter(e => e.employeeEmail === email);
};

export const getExpensesForApproval = (): Expense[] => {
  return getExpenses().filter(e => e.status === 'Submitted' || e.status === 'Waiting Approval');
};

export const saveExpense = (expense: Expense): void => {
  const all = getExpenses();
  const idx = all.findIndex(e => e.id === expense.id);
  if (idx >= 0) {
    all[idx] = expense;
  } else {
    all.push(expense);
  }
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(all));
};

export const createExpense = (data: Omit<Expense, 'id' | 'createdAt' | 'approverTrail' | 'status'>): Expense => {
  const expense: Expense = {
    ...data,
    id: 'EXP-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    createdAt: new Date().toISOString(),
    approverTrail: [],
    status: 'Draft',
  };
  saveExpense(expense);
  return expense;
};

export const submitExpense = (id: string): void => {
  const all = getExpenses();
  const idx = all.findIndex(e => e.id === id);
  if (idx >= 0) {
    all[idx].status = 'Submitted';
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(all));
  }
};

export const approveExpense = (id: string, approverName: string, comment?: string): void => {
  const all = getExpenses();
  const idx = all.findIndex(e => e.id === id);
  if (idx >= 0) {
    all[idx].status = 'Approved';
    all[idx].approverTrail.push({
      approver: approverName,
      status: 'Approved',
      time: new Date().toLocaleString(),
      comment,
    });
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(all));
  }
};

export const rejectExpense = (id: string, approverName: string, comment?: string): void => {
  const all = getExpenses();
  const idx = all.findIndex(e => e.id === id);
  if (idx >= 0) {
    all[idx].status = 'Rejected';
    all[idx].approverTrail.push({
      approver: approverName,
      status: 'Rejected',
      time: new Date().toLocaleString(),
      comment,
    });
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(all));
  }
};

// ----- USER HELPERS -----
const USERS_KEY = 'mockUsers';

export const getMockUsers = (): MockUser[] => {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const saveMockUser = (user: MockUser): boolean => {
  const all = getMockUsers();
  if (all.find(u => u.email === user.email)) return false;
  all.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(all));
  return true;
};

export const updateMockUser = (user: MockUser): void => {
  const all = getMockUsers();
  const idx = all.findIndex(u => u.id === user.id);
  if (idx >= 0) {
    all[idx] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(all));
  }
};

export const sendPasswordEmail = (email: string): string => {
  // Mock: generate random password and log it
  const pwd = Math.random().toString(36).substring(2, 10);
  console.log(`[MOCK] Password for ${email}: ${pwd}`);
  // Update the user's password in storage 
  const usersRaw = localStorage.getItem(USERS_KEY);
  if (usersRaw) {
    const users = JSON.parse(usersRaw);
    const idx = users.findIndex((u: MockUser) => u.email === email);
    if (idx >= 0) {
      users[idx].password = pwd;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  }
  return pwd;
};

// ----- APPROVAL RULES HELPERS -----
const RULES_KEY = 'mock_approval_rules';

export const getApprovalRules = (): ApprovalRule[] => {
  const raw = localStorage.getItem(RULES_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const saveApprovalRule = (rule: ApprovalRule): void => {
  const all = getApprovalRules();
  const idx = all.findIndex(r => r.id === rule.id);
  if (idx >= 0) {
    all[idx] = rule;
  } else {
    all.push(rule);
  }
  localStorage.setItem(RULES_KEY, JSON.stringify(all));
};

export const deleteApprovalRule = (id: string): void => {
  const all = getApprovalRules().filter(r => r.id !== id);
  localStorage.setItem(RULES_KEY, JSON.stringify(all));
};

// ----- CURRENCY HELPERS -----
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 157.2,
  AUD: 1.53,
  CAD: 1.36,
};

export const convertCurrency = (amount: number, from: string, to: string): number => {
  const fromRate = EXCHANGE_RATES[from] || 1;
  const toRate = EXCHANGE_RATES[to] || 1;
  return Number(((amount / fromRate) * toRate).toFixed(2));
};

export const getCompanyCurrency = (): string => {
  return localStorage.getItem('company_currency') || 'USD';
};

export const getCurrencyOptions = () => [
  { label: 'USD ($)', value: 'USD' },
  { label: 'INR (₹)', value: 'INR' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'JPY (¥)', value: 'JPY' },
  { label: 'AUD (A$)', value: 'AUD' },
  { label: 'CAD (C$)', value: 'CAD' },
];

export const getCategoryOptions = () => [
  { label: 'Food', value: 'Food' },
  { label: 'Travel', value: 'Travel' },
  { label: 'Accommodation', value: 'Accommodation' },
  { label: 'Office Supplies', value: 'Office Supplies' },
  { label: 'Software', value: 'Software' },
  { label: 'Miscellaneous', value: 'Miscellaneous' },
];
