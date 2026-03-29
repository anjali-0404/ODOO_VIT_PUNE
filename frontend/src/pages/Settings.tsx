import { useEffect, useMemo, useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useAuth } from '../context/AuthContext';
import {
  createApprovalRule,
  listApprovalRules,
  updateApprovalRule,
  type ApprovalRule,
  type CreateApprovalRulePayload,
} from '../services/api';

const autoApproveRoleOptions = [
  { label: 'None', value: '' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Manager', value: 'MANAGER' },
  { label: 'Employee', value: 'EMPLOYEE' },
  { label: 'Finance', value: 'FINANCE' },
  { label: 'Director', value: 'DIRECTOR' },
  { label: 'CFO', value: 'CFO' },
];

interface RuleFormState {
  name: string;
  minAmount: string;
  maxAmount: string;
  requiredApprovalPercentage: string;
  autoApproveRole: '' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'FINANCE' | 'DIRECTOR' | 'CFO';
  active: boolean;
}

const initialRuleForm: RuleFormState = {
  name: '',
  minAmount: '',
  maxAmount: '',
  requiredApprovalPercentage: '100',
  autoApproveRole: '',
  active: true,
};

const toCreatePayload = (form: RuleFormState): CreateApprovalRulePayload => ({
  name: form.name.trim(),
  minAmount: form.minAmount ? Number(form.minAmount) : undefined,
  maxAmount: form.maxAmount ? Number(form.maxAmount) : undefined,
  requiredApprovalPercentage: form.requiredApprovalPercentage
    ? Number(form.requiredApprovalPercentage)
    : undefined,
  autoApproveRole: form.autoApproveRole || undefined,
  active: form.active,
});

export const Settings = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiError, setApiError] = useState('');
  const [form, setForm] = useState<RuleFormState>(initialRuleForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManageRules = user?.role === 'Admin';

  const loadRules = async () => {
    if (!canManageRules) {
      return;
    }

    setIsLoading(true);
    setApiError('');
    try {
      const data = await listApprovalRules();
      setRules(data);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to load approval rules');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRules();
  }, [canManageRules]);

  const companyCurrency = useMemo(() => localStorage.getItem('company_currency') || 'USD', []);

  const resetForm = () => {
    setForm(initialRuleForm);
  };

  const openNewRule = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleCreateRule = async () => {
    setApiError('');

    if (!form.name.trim()) {
      setApiError('Rule name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await createApprovalRule(toCreatePayload(form));
      setIsModalOpen(false);
      resetForm();
      await loadRules();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to create rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRuleActive = async (rule: ApprovalRule) => {
    setApiError('');
    try {
      await updateApprovalRule(rule.id, { active: !rule.active });
      await loadRules();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to update rule');
    }
  };

  if (!canManageRules) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your profile and session information</p>
        </div>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Name</p>
              <p className="text-sm font-medium text-gray-800 mt-1">{user?.name || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-800 mt-1">{user?.email || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Role</p>
              <p className="text-sm font-medium text-gray-800 mt-1">{user?.role || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Company Currency</p>
              <p className="text-sm font-medium text-gray-800 mt-1">{companyCurrency}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Rules</h1>
          <p className="text-sm text-gray-500 mt-1">Admin view - configure backend approval thresholds</p>
        </div>
        <Button onClick={openNewRule}>
          <Plus size={16} className="mr-2" /> New Rule
        </Button>
      </div>

      {apiError && <p className="text-sm text-red-500">{apiError}</p>}

      {isLoading ? (
        <Card>
          <p className="text-sm text-gray-400">Loading rules...</p>
        </Card>
      ) : rules.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-400">No rules configured yet. Click "New Rule" to create one.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-800">{rule.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Amount range: {rule.minAmount ?? 0} to {rule.maxAmount ?? 'Any'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Required approval: {rule.requiredApprovalPercentage ?? 100}%
                    {rule.autoApproveRole ? ` · Auto-approve role: ${rule.autoApproveRole}` : ''}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={rule.active ? 'outline' : 'primary'}
                  onClick={() => void toggleRuleActive(rule)}
                >
                  {rule.active ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Approval Rule">
        <div className="space-y-4">
          <Input
            label="Rule Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Mid-value approvals"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Amount"
              type="number"
              value={form.minAmount}
              onChange={(e) => setForm((prev) => ({ ...prev, minAmount: e.target.value }))}
            />
            <Input
              label="Max Amount"
              type="number"
              value={form.maxAmount}
              onChange={(e) => setForm((prev) => ({ ...prev, maxAmount: e.target.value }))}
            />
          </div>
          <Input
            label="Required Approval (%)"
            type="number"
            value={form.requiredApprovalPercentage}
            onChange={(e) => setForm((prev) => ({ ...prev, requiredApprovalPercentage: e.target.value }))}
          />
          <Select
            label="Auto-Approve Role"
            options={autoApproveRoleOptions}
            value={form.autoApproveRole}
            onChange={(e) => setForm((prev) => ({ ...prev, autoApproveRole: e.target.value as RuleFormState['autoApproveRole'] }))}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
            />
            Active
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleCreateRule()} isLoading={isSubmitting}>
              <Save size={14} className="mr-2" /> Save Rule
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
