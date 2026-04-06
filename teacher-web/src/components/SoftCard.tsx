import React from 'react';
import { motion } from 'framer-motion';

interface SoftCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const SoftCard: React.FC<SoftCardProps> = ({
  children,
  className = '',
  hover = true,
  padding = 'md',
  onClick
}) => {
  const CardComponent = motion.div;
  
  return (
    <CardComponent
      onClick={onClick}
      whileHover={hover ? { y: -4, boxShadow: '0 12px 24px -8px rgba(0, 0, 0, 0.08)' } : undefined}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        bg-white rounded-2xl
        border border-border
        shadow-card
        ${paddingStyles[padding]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </CardComponent>
  );
};

export default SoftCard;

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center animate-fade-in"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-primary"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

const badgeVariants = {
  default: 'bg-surface text-text-secondary border border-border',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-error-light text-error',
  info: 'bg-info-light text-info',
};

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center font-semibold rounded-full
      ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'}
      ${badgeVariants[variant]}
    `}>
      {children}
    </span>
  );
}

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  const initials = name?.charAt(0)?.toUpperCase() || '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white shadow-sm`}
      />
    );
  }

  return (
    <div className={`
      ${sizeClasses[size]} rounded-full
      bg-gradient-to-br from-primary to-primary-hover
      flex items-center justify-center
      text-white font-semibold
      shadow-sm
    `}>
      {initials}
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

const buttonVariants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'bg-error-light text-error hover:bg-error hover:text-white rounded-xl font-medium px-4 py-2 text-sm transition-all',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseClass = buttonVariants[variant];
  const isCustomDanger = variant === 'danger';

  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`
        ${isCustomDanger ? '' : baseClass}
        ${size !== 'md' && variant !== 'danger' ? buttonSizes[size] : ''}
        ${fullWidth ? 'w-full' : ''}
        ${className}
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  error?: string;
  className?: string;
}

export function Input({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  className = ''
}: InputProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`
          input-field
          ${error ? 'border-error-light focus:border-error focus:ring-error/20' : ''}
        `}
      />
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}

export function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        className="input-field cursor-pointer"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}