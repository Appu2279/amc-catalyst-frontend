import { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

/**
 * Toast — fixed top-right notification.
 *
 * Props:
 *   toast  : { type: 'success' | 'error', message: string } | null
 *   onClose: () => void
 *
 * Auto-dismisses after 4 s. Call onClose to clear it manually.
 */
export const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div
      className={`fixed top-5 right-5 z-[9999] flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-2xl border max-w-sm w-full
        ${isSuccess
          ? 'bg-white border-green-200 text-green-800'
          : 'bg-white border-red-200 text-red-800'}
        animate-in slide-in-from-right-4 duration-300`}
    >
      {/* Icon */}
      <div className={`shrink-0 mt-0.5 ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
        {isSuccess
          ? <CheckCircle2 className="w-5 h-5" />
          : <XCircle      className="w-5 h-5" />}
      </div>

      {/* Message */}
      <p className="text-sm font-medium flex-1 leading-snug">{toast.message}</p>

      {/* Close */}
      <button
        onClick={onClose}
        className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors mt-0.5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
