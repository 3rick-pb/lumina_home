"use client";

import React from "react";
import { Check, ShieldAlert, ShieldCheck } from "lucide-react";
import { evaluatePasswordStrength } from "@/lib/userStore";
import { cn } from "@/lib/utils";

interface StrongPasswordMeterProps {
  password: string;
  className?: string;
  compact?: boolean;
}

export function StrongPasswordMeter({
  password,
  className,
  compact = false,
}: StrongPasswordMeterProps) {
  const evalResult = evaluatePasswordStrength(password);
  const { score, label, isStrong, checks } = evalResult;

  if (!password) {
    return (
      <div className={cn("mt-2 space-y-1.5", className)}>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 ml-0.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#8c9276] shrink-0" />
          <span>
            Requiere <strong>8+ caracteres</strong>, mayúscula, minúscula, número y símbolo (ej.{" "}
            <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-[10px] font-mono">
              !@#$%
            </code>
            ).
          </span>
        </p>
      </div>
    );
  }

  const barColors: Record<0 | 1 | 2 | 3 | 4, string> = {
    0: "bg-gray-200 dark:bg-white/10",
    1: "bg-rose-500",
    2: "bg-amber-500",
    3: "bg-sky-500",
    4: "bg-emerald-500",
  };

  const textColors: Record<0 | 1 | 2 | 3 | 4, string> = {
    0: "text-gray-400",
    1: "text-rose-600 dark:text-rose-400",
    2: "text-amber-600 dark:text-amber-400",
    3: "text-sky-600 dark:text-sky-400",
    4: "text-emerald-600 dark:text-emerald-400",
  };

  const items = [
    { key: "minLength", text: "8+ caracteres", passed: checks.minLength },
    { key: "hasUpperAndLower", text: "Mayúscula y minúscula", passed: checks.hasUpperAndLower },
    { key: "hasNumber", text: "Número (0-9)", passed: checks.hasNumber },
    { key: "hasSymbol", text: "Símbolo (!@#$%)", passed: checks.hasSymbol },
    {
      key: "notCommonOrSequential",
      text: "Sin secuencias (ej. 123456)",
      passed: checks.notCommonOrSequential,
    },
  ];

  return (
    <div
      className={cn(
        "mt-2.5 p-3 rounded-2xl bg-white/75 dark:bg-[#161618]/90 border border-gray-200/80 dark:border-white/10 shadow-xs space-y-2.5 transition-all",
        className
      )}
    >
      {/* Header & 4-bar meter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
            {isStrong ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}
            Nivel de Seguridad
          </span>
          <span className={cn("font-bold tracking-tight", textColors[score])}>
            {label}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                score >= step ? barColors[score] : "bg-gray-200/80 dark:bg-white/10"
              )}
            />
          ))}
        </div>
      </div>

      {/* Checklist pills */}
      <div className={cn("flex flex-wrap gap-1.5", compact && "gap-1")}>
        {items.map((item) => (
          <span
            key={item.key}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all",
              item.passed
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
                : "bg-gray-100/80 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200/70 dark:border-white/10"
            )}
          >
            <Check
              className={cn(
                "w-2.5 h-2.5 shrink-0 transition-transform",
                item.passed ? "text-emerald-500 scale-100" : "opacity-35 scale-75"
              )}
              strokeWidth={3}
            />
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}
