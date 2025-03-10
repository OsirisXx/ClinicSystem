import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <div className="relative rounded-md shadow-sm">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              block w-full rounded-md border-0 py-2.5 shadow-sm ring-1 
              ring-inset ${error ? 'ring-red-300' : 'ring-gray-300'} 
              placeholder:text-gray-400 focus:ring-2 focus:ring-inset 
              ${error ? 'focus:ring-red-500' : 'focus:ring-primary-500'}
              ${icon ? 'pl-10' : 'pl-4'} pr-4 sm:text-sm sm:leading-6
              ${error ? 'bg-red-50' : 'bg-white'}
              transition-all duration-200 ease-in-out
              hover:ring-gray-400
              disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200
              text-gray-900
              focus:outline-none
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
); 