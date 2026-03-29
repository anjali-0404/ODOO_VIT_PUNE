import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, GripVertical, Save, ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useAuth } from '../context/AuthContext';
import {
  getMockUsers,
  getApprovalRules,
  saveApprovalRule,
  deleteApprovalRule,
  type ApprovalRule,
  type RuleApprover,
  type MockUser,
} from '../services/mockData';

export const Settings = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<ApprovalRule[]>(() => getApprovalRules());
  const [users, setUsers] = useState<MockUser[]>(() => getMockUsers());
  const [editingRule, setEditingRule] = useState<ApprovalRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = () => {
    setRules(getApprovalRules());
    setUsers(getMockUsers());
  };

  const userOptions = users.map(u => ({ label: u.name, value: u.id }));
  const managerOptions = users
    .filter(u => u.role === 'Manager' || u.role === 'Admin' || u.role === 'CFO')
    .map(u => ({ label: u.name, value: u.id }));

  const openNewRule = () => {
    setEditingRule({
      id: 'RULE-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      userId: '',
      userName: '',
      description: '',
      managerId: '',
      managerName: '',
      isManagerApprover: false,
      approvers: [],
      isSequential: false,
      minApprovalPercentage: 100,
    });
    setIsModalOpen(true);
  };

  const openEditRule = (rule: ApprovalRule) => {
    setEditingRule({ ...rule });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!editingRule) return;
    // Resolve names
    const userMatch = users.find(u => u.id === editingRule.userId);
    const managerMatch = users.find(u => u.id === editingRule.managerId);
    const finalRule = {
      ...editingRule,
      userName: userMatch?.name || editingRule.userName,
      managerName: managerMatch?.name || editingRule.managerName,
    };
    saveApprovalRule(finalRule);
    setIsModalOpen(false);
    setEditingRule(null);
    loadData();
  };

  const handleDeleteRule = (id: string) => {
    deleteApprovalRule(id);
    loadData();
  };

  const addApprover = () => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      approvers: [
        ...editingRule.approvers,
        { userId: '', userName: '', isRequired: false, order: editingRule.approvers.length + 1 },
      ],
    });
  };

  const updateApprover = (index: number, field: keyof RuleApprover, value: string | boolean | number) => {
    if (!editingRule) return;
    const updated = [...editingRule.approvers];
    if (field === 'userId') {
      const match = users.find(u => u.id === value);
      updated[index] = { ...updated[index], userId: value as string, userName: match?.name || '' };
    } else {
      (updated[index] as unknown as Record<string, unknown>)[field] = value;
    }
    setEditingRule({ ...editingRule, approvers: updated });
  };

  const removeApprover = (index: number) => {
    if (!editingRule) return;
    const updated = editingRule.approvers.filter((_, i) => i !== index);
    setEditingRule({ ...editingRule, approvers: updated });
  };

  const moveApprover = (index: number, direction: 'up' | 'down') => {
    if (!editingRule) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= editingRule.approvers.length) {
      return;
    }

    const updated = [...editingRule.approvers];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const withOrder = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
    setEditingRule({ ...editingRule, approvers: withOrder });
  };

  if (user?.role !== 'Admin') {
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
              <p className="text-sm font-medium text-gray-800 mt-1">{user?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-800 mt-1">{user?.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Role</p>
              <p className="text-sm font-medium text-gray-800 mt-1">{user?.role || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Company Currency</p>
              <p className="text-sm font-medium text-gray-800 mt-1">{localStorage.getItem('company_currency') || 'USD'}</p>
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
          <p className="text-sm text-gray-500 mt-1">Admin view — Configure approval workflows for expenses</p>
        </div>
        <Button onClick={openNewRule}>
          <Plus size={16} className="mr-2" /> New Rule
        </Button>
      </div>

      {/* Existing rules list */}
      {rules.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-400">No approval rules configured yet. Click "New Rule" to create one.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map(rule => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEditRule(rule)}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{rule.description || 'Untitled Rule'}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      User: <span className="font-medium">{rule.userName}</span> · Manager: <span className="font-medium">{rule.managerName || '—'}</span>
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {rule.isManagerApprover && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Manager is approver</span>
                      )}
                      {rule.isSequential && (
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Sequential</span>
                      )}
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {rule.approvers.length} approver(s) · {rule.minApprovalPercentage}% min
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={(e) => {
                      (e as React.MouseEvent).stopPropagation();
                      handleDeleteRule(rule.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Rule Editor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingRule(null); }}
        title="Approval Rule Builder"
        width="max-w-3xl"
      >
        {editingRule && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* Left section: User & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Select
                  label="User"
                  options={userOptions}
                  value={editingRule.userId}
                  onChange={(e) => setEditingRule({ ...editingRule, userId: e.target.value })}
                />
                <Input
                  label="Description about rules"
                  value={editingRule.description}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  placeholder="e.g. Approval rule for miscellaneous expenses"
                />
                <Select
                  label="Manager"
                  options={[{ label: '— None —', value: '' }, ...managerOptions]}
                  value={editingRule.managerId}
                  onChange={(e) => setEditingRule({ ...editingRule, managerId: e.target.value })}
                />
              </div>

              {/* Right section: Approvers */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800">Approvers</h4>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editingRule.isManagerApprover}
                      onChange={(e) => setEditingRule({ ...editingRule, isManagerApprover: e.target.checked })}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    Is manager an approver?
                  </label>
                </div>

                {/* Approvers list */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 border-b border-gray-200">
                    <span className="col-span-1">#</span>
                    <span className="col-span-6">User</span>
                    <span className="col-span-3 text-center">Required</span>
                    <span className="col-span-1 text-center">Move</span>
                    <span className="col-span-1 text-center">Remove</span>
                  </div>

                  <AnimatePresence>
                    {editingRule.approvers.map((approver, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-12 gap-2 items-center px-3 py-2 border-b border-gray-100"
                      >
                        <span className="col-span-1 text-sm text-gray-400 flex items-center gap-1">
                          <GripVertical size={12} className="text-gray-300" /> {idx + 1}
                        </span>
                        <div className="col-span-6">
                          <select
                            value={approver.userId}
                            onChange={(e) => updateApprover(idx, 'userId', e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          >
                            <option value="">Select user</option>
                            {userOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3 text-center">
                          <input
                            type="checkbox"
                            checked={approver.isRequired}
                            onChange={(e) => updateApprover(idx, 'isRequired', e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <p className="text-[10px] text-gray-400">
                            {approver.isRequired ? 'Required' : 'Optional'}
                          </p>
                        </div>
                        <div className="col-span-1 flex items-center justify-center gap-1">
                          <button onClick={() => moveApprover(idx, 'up')} className="text-gray-400 hover:text-gray-700" disabled={idx === 0}>
                            <ArrowUp size={14} />
                          </button>
                          <button onClick={() => moveApprover(idx, 'down')} className="text-gray-400 hover:text-gray-700" disabled={idx === editingRule.approvers.length - 1}>
                            <ArrowDown size={14} />
                          </button>
                        </div>
                        <div className="col-span-1 text-center">
                          <button onClick={() => removeApprover(idx)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <button
                    onClick={addApprover}
                    className="w-full text-sm text-primary hover:bg-blue-50 px-3 py-2 flex items-center gap-1 transition-colors"
                  >
                    <Plus size={14} /> Add Approver
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom controls */}
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={editingRule.isSequential}
                  onChange={(e) => setEditingRule({ ...editingRule, isSequential: e.target.checked })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Approvers Sequence</span>
                </div>
              </label>

              <div className="flex items-center gap-3">
                <Input
                  label="Minimum Approval Percentage"
                  type="number"
                  min="1"
                  max="100"
                  value={editingRule.minApprovalPercentage.toString()}
                  onChange={(e) => setEditingRule({ ...editingRule, minApprovalPercentage: Number(e.target.value) })}
                  className="w-32"
                />
                <span className="text-lg text-gray-500 mt-6">%</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Approval Threshold Slider</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={editingRule.minApprovalPercentage}
                  onChange={(e) => setEditingRule({ ...editingRule, minApprovalPercentage: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingRule(null); }}>Cancel</Button>
              <Button onClick={handleSave}>
                <Save size={16} className="mr-2" /> Save Rule
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
