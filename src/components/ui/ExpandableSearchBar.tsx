"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";

interface ExpandableSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  expandedWidth?: string;
  onClear?: () => void;
}

export function ExpandableSearchBar({
  value,
  onChange,
  placeholder = "Buscar...",
  className = "",
  expandedWidth = "w-full sm:w-72",
  onClear,
}: ExpandableSearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(Boolean(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setIsExpanded(true);
    }
  }, [value]);

  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  // Click outside to collapse if empty
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        if (!value.trim()) {
          setIsExpanded(false);
        }
      }
    }
    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isExpanded, value]);

  const handleClear = () => {
    onChange("");
    onClear?.();
    inputRef.current?.focus();
  };

  const handleCollapse = () => {
    onChange("");
    onClear?.();
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      handleCollapse();
    }
  };

  return (
    <div ref={containerRef} className={`relative flex items-center justify-end ${className}`}>
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 460, damping: 32 }}
        className={`flex items-center overflow-hidden h-9 rounded-2xl border transition-all duration-300 ${
          isExpanded
            ? `${expandedWidth} bg-white dark:bg-[#1a1a1c] border-stone-300 dark:border-white/15 shadow-sm ring-2 ring-amber-400/20 px-2.5`
            : "w-9 bg-white dark:bg-[#1a1a1c] border-stone-200/80 dark:border-white/10 shadow-xs hover:border-amber-400/40 hover:bg-stone-50 dark:hover:bg-white/5 cursor-pointer justify-center"
        }`}
        onClick={() => {
          if (!isExpanded) {
            setIsExpanded(true);
          }
        }}
      >
        <button
          type="button"
          aria-label={isExpanded ? "Buscar" : "Abrir buscador"}
          onClick={(e) => {
            if (!isExpanded) {
              e.stopPropagation();
              setIsExpanded(true);
            }
          }}
          className={`flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
            isExpanded
              ? "text-amber-600 dark:text-amber-400 mr-2"
              : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex-1 flex items-center min-w-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full bg-transparent text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none font-medium truncate"
              />
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-5 h-5 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-1"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={handleCollapse}
                className="w-5 h-5 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-0.5"
                title="Cerrar búsqueda (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
