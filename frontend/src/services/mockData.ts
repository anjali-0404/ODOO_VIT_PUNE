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
  approvalConfig?: ApprovalConfig;
  createdAt: string;
}

export interface ApproverAction {
  approverId?: string;
  approver: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  time?: string;
  comment?: string;
}

export interface ApprovalConfig {
  sequential: boolean;
  minApprovalPercentage: number;
  requiredApproverIds: string[];
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

export interface ApprovalActor {
  id: string;
  name: string;
  email: string;
  role: MockUser['role'];
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
  const parsed: Expense[] = raw ? JSON.parse(raw) : [];
  return parsed.map((expense) => ({
    ...expense,
    approverTrail: expense.approverTrail || [],
  }));
};

export const getExpensesByEmployee = (email: string): Expense[] => {
  return getExpenses().filter(e => e.employeeEmail === email);
};

const getPendingTrailItems = (expense: Expense): ApproverAction[] => {
  const pending = expense.approverTrail.filter((a) => a.status === 'Pending');
  if (!(expense.approvalConfig?.sequential)) {
    return pending;
  }
  return pending.length > 0 ? [pending[0]] : [];
};

export const canActorApproveExpense = (expense: Expense, actor: ApprovalActor): boolean => {
  if (expense.status !== 'Submitted' && expense.status !== 'Waiting Approval') {
    return false;
  }

  // Fallback for older expenses that have no rule/approver trail yet.
  if (expense.approverTrail.length === 0) {
    return actor.role === 'Admin' || actor.role === 'Manager' || actor.role === 'CFO';
  }

  return getPendingTrailItems(expense).some((a) => a.approverId === actor.id);
};

export const getExpensesForApproval = (actor?: ApprovalActor): Expense[] => {
  const pending = getExpenses().filter(e => e.status === 'Submitted' || e.status === 'Waiting Approval');
  if (!actor) {
    return pending;
  }
  return pending.filter((expense) => canActorApproveExpense(expense, actor));
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
    approvalConfig: undefined,
    status: 'Draft',
  };
  saveExpense(expense);
  return expense;
};

const uniqByUserId = (approvers: RuleApprover[]): RuleApprover[] => {
  const seen = new Set<string>();
  return approvers.filter((approver) => {
    if (!approver.userId || seen.has(approver.userId)) return false;
    seen.add(approver.userId);
    return true;
  });
};

const buildApprovalFlow = (expense: Expense): {
  trail: ApproverAction[];
  config: ApprovalConfig | undefined;
} => {
  const users = getMockUsers();
  const employee = users.find((u) => u.email === expense.employeeEmail);
  const rules = getApprovalRules();
  const rule = employee ? rules.find((r) => r.userId === employee.id) : undefined;

  const dynamicApprovers: RuleApprover[] = [];

  if (rule?.isManagerApprover && rule.managerId) {
    const manager = users.find((u) => u.id === rule.managerId);
    if (manager) {
      dynamicApprovers.push({
        userId: manager.id,
        userName: manager.name,
        isRequired: true,
        order: 0,
      });
    }
  }

  if (rule) {
    const sortedConfigured = [...rule.approvers].sort((a, b) => a.order - b.order);
    sortedConfigured.forEach((a) => {
      const matchedUser = users.find((u) => u.id === a.userId);
      dynamicApprovers.push({
        ...a,
        userName: matchedUser?.name || a.userName,
      });
    });
  } else if (employee?.managerId) {
    const manager = users.find((u) => u.id === employee.managerId);
    if (manager) {
      dynamicApprovers.push({
        userId: manager.id,
        userName: manager.name,
        isRequired: true,
        order: 1,
      });
    }
  }

  const approvers = uniqByUserId(dynamicApprovers);
  const trail: ApproverAction[] = approvers.map((approver) => ({
    approverId: approver.userId,
    approver: approver.userName,
    status: 'Pending',
  }));

  if (trail.length === 0) {
    return { trail: [], config: undefined };
  }

  return {
    trail,
    config: {
      sequential: rule?.isSequential ?? true,
      minApprovalPercentage: Math.max(1, Math.min(100, rule?.minApprovalPercentage ?? 100)),
      requiredApproverIds: approvers.filter((a) => a.isRequired).map((a) => a.userId),
    },
  };
};

export const submitExpense = (id: string): void => {
  const all = getExpenses();
  const idx = all.findIndex(e => e.id === id);
  if (idx >= 0) {
    const built = buildApprovalFlow(all[idx]);
    all[idx].approverTrail = built.trail;
    all[idx].approvalConfig = built.config;
    all[idx].status = built.trail.length > 0 ? 'Waiting Approval' : 'Submitted';
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(all));
  }
};

const resolveExpenseStatusAfterApproval = (expense: Expense): Expense['status'] => {
  if (expense.approverTrail.some((a) => a.status === 'Rejected')) {
    return 'Rejected';
  }

  if (expense.approverTrail.length === 0) {
    return 'Approved';
  }

  const approvedCount = expense.approverTrail.filter((a) => a.status === 'Approved').length;
  const totalCount = expense.approverTrail.length;
  const approvedPercentage = (approvedCount / totalCount) * 100;
  const minApprovalPercentage = expense.approvalConfig?.minApprovalPercentage ?? 100;
  const requiredIds = expense.approvalConfig?.requiredApproverIds ?? [];
  const requiredApproved = requiredIds.every((id) =>
    expense.approverTrail.some((a) => a.approverId === id && a.status === 'Approved')
  );

  if (requiredApproved && approvedPercentage >= minApprovalPercentage) {
    return 'Approved';
  }

  if (expense.approverTrail.some((a) => a.status === 'Pending')) {
    return 'Waiting Approval';
  }

  return 'Rejected';
};

export const approveExpense = (id: string, actor: ApprovalActor, comment?: string): void => {
  const all = getExpenses();
  const idx = all.findIndex(e => e.id === id);
  if (idx < 0) return;

  const expense = all[idx];
  if (!canActorApproveExpense(expense, actor)) return;

  if (expense.approverTrail.length === 0) {
    expense.approverTrail.push({
      approverId: actor.id,
      approver: actor.name,
      status: 'Approved',
      time: new Date().toLocaleString(),
      comment,
    });
    expense.status = 'Approved';
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(all));
    return;
  }

  const pendingItems = getPendingTrailItems(expense);
  const approverEntry = pendingItems.find((a) => a.approverId === actor.id);
  if (!approverEntry) return;

  const trailIndex = expense.approverTrail.findIndex(
    (a) => a.approverId === approverEntry.approverId && a.status === 'Pending'
  );
  if (trailIndex < 0) return;

  expense.approverTrail[trailIndex] = {
    ...expense.approverTrail[trailIndex],
    status: 'Approved',
    time: new Date().toLocaleString(),
    comment,
  };
  expense.status = resolveExpenseStatusAfterApproval(expense);
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(all));
};

export const rejectExpense = (id: string, actor: ApprovalActor, comment?: string): void => {
  const all = getExpenses();
  const idx = all.findIndex(e => e.id === id);
  if (idx < 0) return;

  const expense = all[idx];
  if (!canActorApproveExpense(expense, actor)) return;

  if (expense.approverTrail.length === 0) {
    expense.approverTrail.push({
      approverId: actor.id,
      approver: actor.name,
      status: 'Rejected',
      time: new Date().toLocaleString(),
      comment,
    });
    expense.status = 'Rejected';
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(all));
    return;
  }

  const pendingItems = getPendingTrailItems(expense);
  const approverEntry = pendingItems.find((a) => a.approverId === actor.id);
  if (!approverEntry) return;

  const trailIndex = expense.approverTrail.findIndex(
    (a) => a.approverId === approverEntry.approverId && a.status === 'Pending'
  );
  if (trailIndex < 0) return;

  expense.approverTrail[trailIndex] = {
    ...expense.approverTrail[trailIndex],
    status: 'Rejected',
    time: new Date().toLocaleString(),
    comment,
  };
  expense.status = 'Rejected';
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(all));
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
