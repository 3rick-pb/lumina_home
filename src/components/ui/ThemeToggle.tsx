import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useThemeStore, ThemeMode } from '@/lib/themeStore';
import { useUserStore } from '@/lib/userStore';

export function ThemeToggle() {
  const { mode, setMode } = useThemeStore();
  const user = useUserStore(state => state.user);

  const options: { id: ThemeMode; icon: React.ElementType; label: string }[] = [
    { id: 'light', icon: Sun, label: 'Claro' },
    { id: 'auto', icon: Sparkles, label: 'Auto' },
    { id: 'dark', icon: Moon, label: 'Oscuro' },
  ];

  return (
    <div className="relative flex items-center bg-[#e5e5e5]/80 dark:bg-[#1a1a1a]/80 backdrop-blur-3xl rounded-full p-1.5 shadow-[inset_0_2px_12px_rgba(0,0,0,0.06),inset_0_4px_4px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_2px_12px_rgba(0,0,0,0.4),inset_0_4px_4px_rgba(0,0,0,0.4)] border border-white/60 dark:border-white/5 w-full max-w-[340px] transition-colors duration-500 select-none">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = mode === option.id;
        
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setMode(option.id, user?.id)}
            className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-bold transition-colors duration-300 cursor-pointer rounded-full ${
              isActive ? "text-gray-950 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="theme-knob"
                className="absolute inset-0 rounded-full bg-white dark:bg-[#2c2c2e] shadow-[0_3px_12px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_3px_12px_rgba(0,0,0,0.4)] border border-black/[0.04] dark:border-white/10"
                initial={false}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <div className="relative z-10 flex items-center gap-2">
              <Icon className={`w-4 h-4 transition-colors duration-300 ${isActive ? 'text-amber-500 dark:text-[#ccff00]' : ''}`} />
              <span className="tracking-wide">{option.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
