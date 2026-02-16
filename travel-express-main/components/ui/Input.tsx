'use client';
import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-semibold text-slate-700 ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          <input
            ref={ref}
            className={cn(
              "w-full px-5 py-3 rounded-xl outline-none transition-all duration-300",
              "bg-slate-50 border-2 border-slate-100 text-slate-900 placeholder:text-slate-400",
              "focus:bg-white focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]",
              "hover:border-slate-300",
              icon && "pl-12",
              error 
                ? "border-red-300 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)] bg-red-50/50" 
                : "",
              className
            )}
            {...props}
          />
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 peer-focus:text-blue-500 transition-colors">
              {icon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1 animate-in slide-in-from-top-1 fade-in duration-200">
            <span>●</span> {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";


