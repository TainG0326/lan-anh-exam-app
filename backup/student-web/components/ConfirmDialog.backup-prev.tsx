import { createContext, useContext, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

type ConfirmDialogType = 'info' | 'warning' | 'danger' | 'success';

interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmDialogType;
  onConfirm?: () => void;
}

interface ConfirmDialogContextType {
  confirm: (data: ConfirmDialogData) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export function useConfirm() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

function ConfirmDialogContent({ 
  dialogData, 
  onConfirm, 
  onCancel 
}: { 
  dialogData: ConfirmDialogData | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!dialogData) return null;

  const getIcon = () => {
    switch (dialogData.type) {
      case 'danger':
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-amber-500" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      default:
        return <Info className="w-8 h-8 text-blue-500" />;
    }
  };

  const getButtonColor = () => {
    switch (dialogData.type) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'success':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-primary hover:bg-primary-dark';
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up z-10">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-surface-hover transition-colors"
        >
          <X className="w-5 h-5 text-text-muted" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-text-primary mb-2">
            {dialogData.title}
          </h3>
          <p className="text-text-secondary mb-6">
            {dialogData.message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-border rounded-xl font-medium text-text-secondary hover:bg-surface-hover transition-all"
            >
              {dialogData.cancelText || 'Hủy'}
            </button>
            <button
              onClick={() => {
                dialogData.onConfirm?.();
                onConfirm();
              }}
              className={`flex-1 px-4 py-3 ${getButtonColor()} text-white rounded-xl font-medium transition-all`}
            >
              {dialogData.confirmText || 'Xác nhận'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialogData, setDialogData] = useState<ConfirmDialogData | null>(null);
  const [resolve, setResolve] = useState<((value: boolean) => void) | null>(null);

  const confirm = (data: ConfirmDialogData): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogData(data);
      setResolve(() => resolve);
    });
  };

  const handleConfirm = () => {
    setDialogData(null);
    resolve?.(true);
  };

  const handleCancel = () => {
    setDialogData(null);
    resolve?.(false);
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialogContent 
        dialogData={dialogData} 
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmDialogContext.Provider>
  );
}
