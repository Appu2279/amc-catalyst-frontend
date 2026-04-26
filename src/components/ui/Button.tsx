import React from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  children, 
  ...props 
}) => {
  const variants = {
    primary: 'bg-brand-blue text-white hover:bg-brand-blue-hover shadow-lg shadow-brand-blue/30',
    secondary: 'bg-brand-violet text-white hover:bg-brand-violet-hover shadow-lg shadow-brand-violet/30',
    gold: 'bg-brand-gold text-white hover:bg-brand-gold-light hover:text-slate-900 shadow-lg shadow-brand-gold/30',
    outline: 'border-2 border-brand-blue text-brand-blue hover:bg-brand-blue/5',
    ghost: 'text-slate-600 hover:text-brand-blue hover:bg-slate-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg font-semibold',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
