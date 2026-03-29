import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Upload, X, Loader2 } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import {
  getCurrencyOptions,
  getCategoryOptions,
  convertCurrency,
  getCompanyCurrency,
} from '../services/mockData';
import { createExpense as createExpenseApi } from '../services/api';
import { pushNotification } from '../services/notifications';

interface ReceiptPreview {
  id: string;
  name: string;
  preview: string;
}

export const CreateExpense = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receipts, setReceipts] = useState<ReceiptPreview[]>([]);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      paidBy: user?.name || '',
      currency: getCompanyCurrency(),
      amount: '',
      merchant: '',
      remarks: '',
    },
  });

  const watchCurrency = watch('currency');
  const watchAmount = watch('amount');
  const companyCurrency = getCompanyCurrency();

  const convertedAmount = watchAmount && watchCurrency !== companyCurrency
    ? convertCurrency(Number(watchAmount), watchCurrency, companyCurrency)
    : null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const processFiles = (files: File[]) => {
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setReceipts((prev) => [
          ...prev,
          { id: `${file.name}-${Date.now()}-${Math.random()}`, name: file.name, preview },
        ]);
      };
      reader.readAsDataURL(file);
    });

    simulateOCR(files[0]);
  };

  const simulateOCR = (file: File) => {
    setIsOcrLoading(true);
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    const amountFromName = fileName.match(/(\d+(?:\.\d{1,2})?)/)?.[1] || '5667';
    const merchantGuess = fileName.split(/[-_ ]/).filter(Boolean)[0] || 'Merchant';

    setTimeout(() => {
      setValue('amount', amountFromName);
      setValue('category', 'Food');
      setValue('merchant', merchantGuess);
      setValue('description', `${merchantGuess} bill`);
      setValue('date', new Date().toISOString().split('T')[0]);
      setIsOcrLoading(false);
    }, 2000);
  };

  const removeReceipt = (id: string) => {
    setReceipts((prev) => prev.filter((item) => item.id !== id));
  };

  const onSubmit = async (data: Record<string, string>) => {
    setApiError('');
    setIsSubmitting(true);

    try {
      await createExpenseApi({
        description: data.description,
        expenseDate: data.date,
        category: data.category,
        amount: Number(data.amount),
        currency: data.currency,
        receiptUrl: receipts[0]?.preview,
    });

      pushNotification({
        title: 'Expense Submitted',
        message: `Expense ${data.description} was submitted and is waiting for approval.`,
        type: 'info',
      });

      navigate('/expenses');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to create expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Submit Expense</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Receipt Upload with drag & drop */}
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Attach Receipt</h3>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-primary bg-blue-50'
                : 'border-gray-300 hover:border-primary hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            {receipts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {receipts.map((item) => (
                  <div key={item.id} className="relative">
                    <img src={item.preview} alt={item.name} className="h-24 w-full object-cover rounded-lg shadow" />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeReceipt(item.id); }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 -mt-2 -mr-2"
                    >
                      <X size={14} />
                    </button>
                    <p className="mt-1 truncate text-xs text-gray-500">{item.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="mx-auto text-gray-400" size={40} />
                <p className="text-gray-600 font-medium">Drag & drop receipts here</p>
                <p className="text-xs text-gray-400">or click to browse multiple files</p>
              </div>
            )}
          </div>

          {isOcrLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-primary text-sm"
            >
              <Loader2 className="animate-spin" size={16} />
              <span>Processing receipt with OCR... auto-filling fields</span>
            </motion.div>
          )}
        </Card>

        {/* Right: Expense Form matching wireframe */}
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Description"
              {...register('description', { required: 'Description is required' })}
              error={errors.description?.message as string}
            />

            <Input
              label="Expense Date"
              type="date"
              {...register('date', { required: 'Date is required' })}
              error={errors.date?.message as string}
            />

            <Input
              label="Merchant"
              {...register('merchant')}
              placeholder="Auto-filled from OCR"
            />

            <Select
              label="Category"
              options={getCategoryOptions()}
              {...register('category', { required: 'Category is required' })}
              error={errors.category?.message as string}
            />

            <Input
              label="Paid by"
              {...register('paidBy', { required: 'Payer is required' })}
              error={errors.paidBy?.message as string}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Currency"
                options={getCurrencyOptions()}
                {...register('currency')}
              />
              <Input
                label="Total Amount"
                type="number"
                step="0.01"
                {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Must be positive' } })}
                error={errors.amount?.message as string}
              />
            </div>

            {convertedAmount !== null && (
              <p className="text-sm text-gray-500 bg-blue-50 px-3 py-2 rounded-lg">
                Converted: <span className="font-semibold text-primary">{convertedAmount} {companyCurrency}</span>
                <span className="text-xs ml-1">(real-time conversion)</span>
              </p>
            )}

            <Input
              label="Remarks"
              {...register('remarks')}
            />

            {apiError && <p className="text-sm text-red-500">{apiError}</p>}

            {/* Approver trail placeholder */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-xs text-gray-400 mb-2">Approver Trail</p>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
                <div className="grid grid-cols-3 gap-2 font-medium text-gray-600 border-b border-gray-200 pb-2 mb-2">
                  <span>Approver</span>
                  <span>Status</span>
                  <span>Time</span>
                </div>
                <p className="text-gray-400 italic">Will populate after submission</p>
              </div>
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Submit
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
