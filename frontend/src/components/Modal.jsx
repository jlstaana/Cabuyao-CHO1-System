import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      <div className={`relative bg-surface rounded-2xl shadow-xl dark:shadow-none w-full ${maxWidth} flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        <div className="flex justify-between items-center p-5 border-b border-slate-300 dark:border-zinc-800 dark:border-zinc-800">
          <h3 className="font-semibold text-lg text-text">{title}</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 p-1.5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );
}
