"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

export interface LuminaComboboxOption {
  value: string;
  label: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface LuminaComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | LuminaComboboxOption)[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  required?: boolean;
  emptyLabel?: string;
  searchable?: boolean;
}

export function LuminaCombobox({
  value,
  onChange,
  options,
  placeholder = "Seleccionar opción...",
  icon,
  className = "",
  size = "md",
  disabled = false,
  emptyLabel = "No hay opciones disponibles",
  searchable = false,
}: LuminaComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to uniform LuminaComboboxOption objects
  const normalizedOptions: LuminaComboboxOption[] = options.map((opt) => {
    if (typeof opt === "string") {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Selected option resolution
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Filtered options if searchable is enabled
  const filteredOptions = searchable && search.trim()
    ? normalizedOptions.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase().trim())
      )
    : normalizedOptions;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearch("");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs rounded-xl",
    md: "px-3.5 py-2.5 text-xs sm:text-sm rounded-xl",
    lg: "px-4 py-3 text-sm rounded-2xl",
  }[size];

  return (
    <div ref={containerRef} className={`relative inline-block w-full text-left ${className}`}>
      {/* TRIGGER BUTTON */}
      <motion.button
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.01 } : undefined}
        whileTap={!disabled ? { scale: 0.985 } : undefined}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
        className={`w-full flex items-center justify-between gap-2.5 font-medium transition-all outline-none border cursor-pointer select-none ${sizeClasses} ${
          isOpen
            ? "border-[#FF5E00] ring-2 ring-[#FF5E00]/20 bg-white dark:bg-[#1f1f22] shadow-md shadow-[#FF5E00]/5"
            : "border-gray-200/90 dark:border-white/10 bg-white/90 dark:bg-[#1a1a1c]/90 hover:border-gray-300 dark:hover:border-white/20 hover:bg-stone-50/80 dark:hover:bg-[#202024] shadow-sm"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon ? (
            <span className="shrink-0 text-[#FF5E00]">{icon}</span>
          ) : selectedOption?.icon ? (
            <span className="shrink-0">{selectedOption.icon}</span>
          ) : null}

          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#FF5E00]/10 text-[#FF5E00] border border-[#FF5E00]/20">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 font-normal truncate">
              {placeholder}
            </span>
          )}
        </div>

        {/* CHEVRON WITH SMOOTH ROTATION */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 24 }}
          className="shrink-0 text-gray-400 dark:text-gray-500"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* POPUP DROPDOWN MENU WITH SPRING REBOUND PHYSICS */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 4 }}
            exit={{ opacity: 0, scale: 0.94, y: -4 }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 24,
              mass: 0.75,
            }}
            style={{ transformOrigin: "top center" }}
            className="absolute left-0 right-0 z-50 mt-1 min-w-[200px] max-h-64 overflow-y-auto rounded-2xl border border-gray-200 dark:border-white/15 bg-white/95 dark:bg-[#1c1c1f]/95 backdrop-blur-xl shadow-2xl p-1.5 focus:outline-none"
          >
            {/* OPTIONAL SEARCH */}
            {searchable && (
              <div className="p-1.5 mb-1 border-b border-gray-100 dark:border-white/5">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  autoFocus
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#252528] text-gray-900 dark:text-gray-100 outline-none focus:border-[#FF5E00]"
                />
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400 dark:text-gray-500">
                {emptyLabel}
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <motion.button
                      key={opt.value || "__empty_val__"}
                      type="button"
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 450, damping: 25 }}
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearch("");
                      }}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 text-xs sm:text-sm rounded-xl text-left transition-colors cursor-pointer select-none ${
                        isSelected
                          ? "bg-[#FF5E00]/10 dark:bg-[#FF5E00]/20 text-[#FF5E00] font-bold"
                          : "text-gray-700 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                        <span className="truncate">{opt.label}</span>
                        {opt.badge && (
                          <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-[#FF5E00]/15 text-[#FF5E00]">
                            {opt.badge}
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          className="shrink-0 text-[#FF5E00]"
                        >
                          <Check className="w-4 h-4" />
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
