'use client';
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ 
  className, 
  isLoading, 
  variant = 'primary', 
  size = 'md',
  children, 
  disabled, 
  ...props 
}: ButtonProps) {
  
  const variants = {
    // Primaire devient Noir/Slate comme avant, ou vous pouvez mettre #db9b16 ici aussi
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/10 border border-slate-800",
    
    // Glow devient le style doré "Travel Express" (remplace le bleu)
    glow: "bg-[#db9b16] text-white hover:bg-[#c48a14] shadow-lg shadow-[#db9b16]/20 border-0 hover:-translate-y-0.5 transition-all",
    
    outline: "border border-slate-200 bg-white/50 backdrop-blur-sm hover:border-[#db9b16] hover:text-[#db9b16] text-slate-700",
    
    ghost: "bg-transparent hover:bg-[#db9b16]/10 text-slate-600 hover:text-[#db9b16]"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-4 text-base font-bold"
  };

  return (
    <button
      disabled={isLoading || disabled}
      className={cn(
        "relative flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Chargement...
        </span>
      ) : (
        children
      )}
    </button>
  );
}