import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <div className="relative rounded-md shadow-sm">
          <textarea
            ref={ref}
            className={`
              block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 
              ring-inset ${error ? 'ring-red-300' : 'ring-gray-300'}
              placeholder:text-gray-400 focus:ring-2 focus:ring-inset 
              ${error ? 'focus:ring-red-500' : 'focus:ring-primary-500'}
              pl-4 pr-4 sm:text-sm sm:leading-6
              ${error ? 'bg-red-50' : 'bg-white'}
              transition-all duration-200 ease-in-out
              hover:ring-gray-400
              disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200
              resize-none
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