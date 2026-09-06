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
    <div className="relative flex items-center bg-[#e5e5e5]/80 dark:bg-[#1a1a1a]/80 backdrop-blur-3xl rounded-[2rem] p-1.5 shadow-[inset_0_2px_12px_rgba(0,0,0,0.06),inset_0_4px_4px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_2px_12px_rgba(0,0,0,0.4),inset_0_4px_4px_rgba(0,0,0,0.4)] border border-white/60 dark:border-white/5 w-full max-w-[340px] transition-colors duration-[2500ms]">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = mode === option.id;
        
        return (
          <button
            key={option.id}
            onClick={() => setMode(option.id, user?.id)}
            className={`relative flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-bold transition-all duration-700 cursor-pointer ${
              isActive ? "text-gray-900 dark:text-white scale-105" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:scale-100"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="knob"
                className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-b from-white/90 to-white/60 dark:from-white/10 dark:to-white/5 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_4px_8px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_2px_6px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)] border border-white/80 dark:border-white/20"
                initial={false}
                transition={{ type: "spring", stiffness: 280, damping: 25, mass: 1.2 }}
              />
            )}
            <div className="relative z-10 flex items-center gap-2">
              <Icon className={`w-4 h-4 transition-all duration-700 ${isActive ? 'drop-shadow-md text-amber-500 dark:text-white' : ''}`} />
              <span className="tracking-wide">{option.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
