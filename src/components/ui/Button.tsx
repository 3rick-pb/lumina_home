import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "glass";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className = "",
  variant = "glass",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2";

  const variants = {
    // Liquid Glass variants
    glass: "bg-white/40 backdrop-blur-xl border border-white/60 text-gray-900 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:bg-white/60 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)]",
    primary: "bg-white/40 backdrop-blur-xl border border-white/60 text-gray-900 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:bg-white/60 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)]", // Same as glass for backward compatibility, completely removing solid colors
    secondary: "bg-black/10 backdrop-blur-md border border-white/20 text-gray-900 hover:bg-black/20",
    outline: "border border-white/40 bg-transparent text-gray-900 hover:bg-white/20 backdrop-blur-md",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
