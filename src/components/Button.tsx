import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    icon,
    children, 
    className = '',
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none transition-all duration-200';
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const variantStyles = {
      primary: `
        bg-primary-600 text-white hover:bg-primary-700
        focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
        disabled:bg-primary-300
      `,
      secondary: `
        bg-white text-gray-700 ring-1 ring-inset ring-gray-300
        hover:bg-gray-50 hover:text-gray-900
        focus:ring-2 focus:ring-primary-500
        disabled:bg-gray-50 disabled:text-gray-500
      `,
      danger: `
        bg-red-600 text-white hover:bg-red-700
        focus:ring-2 focus:ring-offset-2 focus:ring-red-500
        disabled:bg-red-300
      `,
      success: `
        bg-green-600 text-white hover:bg-green-700
        focus:ring-2 focus:ring-offset-2 focus:ring-green-500
        disabled:bg-green-300
      `,
      warning: `
        bg-yellow-600 text-white hover:bg-yellow-700
        focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500
        disabled:bg-yellow-300
      `,
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          ${baseStyles}
          ${sizeStyles[size]}
          ${variantStyles[variant]}
          ${disabled || isLoading ? 'cursor-not-allowed opacity-60' : ''}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          <>
            {icon && <span className="mr-2">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
); 