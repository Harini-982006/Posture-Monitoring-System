import React, { useEffect, useState } from 'react';
import { ToastNotification } from '../hooks/useNotifications';

interface ToastNotificationsProps {
    toasts: ToastNotification[];
    onDismiss: (id: string) => void;
}

const typeConfig = {
    'info': {
        bg: 'bg-gradient-to-r from-sky-500 to-blue-600',
        border: 'border-sky-400/30',
        icon: '💡',
        glow: 'shadow-sky-500/20',
    },
    'warning': {
        bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
        border: 'border-amber-400/30',
        icon: '⚠️',
        glow: 'shadow-amber-500/20',
    },
    'critical': {
        bg: 'bg-gradient-to-r from-rose-500 to-red-600',
        border: 'border-rose-400/30',
        icon: '🔴',
        glow: 'shadow-rose-500/20',
    },
    'head-tilt': {
        bg: 'bg-gradient-to-r from-violet-500 to-purple-600',
        border: 'border-violet-400/30',
        icon: '🔄',
        glow: 'shadow-violet-500/20',
    },
};

const ToastItem: React.FC<{ toast: ToastNotification; onDismiss: (id: string) => void; index: number }> = ({ toast, onDismiss, index }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [progress, setProgress] = useState(100);
    const config = typeConfig[toast.type];
    const TOAST_DURATION = 8000;

    useEffect(() => {
        // Animate in
        const showTimer = setTimeout(() => setIsVisible(true), 50 + index * 100);

        // Progress bar countdown
        const interval = setInterval(() => {
            const elapsed = Date.now() - toast.timestamp.getTime();
            const remaining = Math.max(0, ((TOAST_DURATION - elapsed) / TOAST_DURATION) * 100);
            setProgress(remaining);

            if (remaining <= 0) {
                setIsVisible(false);
                setTimeout(() => onDismiss(toast.id), 300);
            }
        }, 50);

        return () => {
            clearTimeout(showTimer);
            clearInterval(interval);
        };
    }, [toast.id, toast.timestamp, onDismiss, index]);

    return (
        <div
            className={`transform transition-all duration-300 ease-out ${isVisible
                    ? 'translate-x-0 opacity-100 scale-100'
                    : 'translate-x-full opacity-0 scale-95'
                }`}
            style={{ marginBottom: '12px' }}
        >
            <div className={`${config.bg} rounded-2xl p-4 shadow-2xl ${config.glow} border ${config.border} backdrop-blur-xl min-w-[340px] max-w-[400px] relative overflow-hidden`}>
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
                    <div
                        className="h-full bg-white/40 rounded-full transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="relative z-10 flex items-start gap-3">
                    {/* Icon with pulse animation for critical */}
                    <div className={`text-2xl flex-shrink-0 mt-0.5 ${toast.type === 'critical' ? 'animate-bounce' : ''}`}>
                        {config.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="text-white font-black text-sm leading-tight">{toast.title}</h4>
                        <p className="text-white/80 text-xs mt-1 leading-relaxed">{toast.message}</p>
                        <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-2">
                            {toast.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>

                    {/* Dismiss button */}
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            setTimeout(() => onDismiss(toast.id), 300);
                        }}
                        className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

const ToastNotifications: React.FC<ToastNotificationsProps> = ({ toasts, onDismiss }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
            <div className="pointer-events-auto">
                {toasts.map((toast, index) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onDismiss={onDismiss}
                        index={index}
                    />
                ))}
            </div>
        </div>
    );
};

export default ToastNotifications;
