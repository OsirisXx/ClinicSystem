import React from 'react';

interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  children,
  footer,
  className = '',
}) => {
  return (
    <div className={`bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg ${className}`}>
      {(title || description) && (
        <div className="px-4 py-6 sm:p-6">
          {title && (
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-500">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="px-4 py-5 sm:p-6">{children}</div>
      {footer && (
        <div className="px-4 py-4 sm:px-6 bg-gray-50 rounded-b-lg border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  );
}; 