import React, { forwardRef, useId } from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
  errorText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    helperText,
    error = false,
    errorText,
    fullWidth = false,
    leftIcon,
    rightIcon,
    className,
    id,
    required = false,
    disabled = false,
    ...props
  }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;

    const inputClasses = clsx(
      'rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 block transition-colors',
      {
        'pl-10': leftIcon,
        'pr-10': rightIcon,
        'w-full': fullWidth,
        'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50': error,
        'border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white': !error,
        'bg-gray-100 cursor-not-allowed': disabled,
      },
      'py-2 px-3 text-base',
      className
    );

    const describedBy = [
      error && errorId,
      !error && helperText && helperId
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className={clsx('flex flex-col', { 'w-full': fullWidth })}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && (
              <span className="text-red-600 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}
          {error ? (
            <input
              id={inputId}
              ref={ref}
              className={inputClasses}
              aria-invalid="true"
              aria-describedby={describedBy}
              required={required}
              disabled={disabled}
              {...props}
            />
          ) : (
            <input
              id={inputId}
              ref={ref}
              className={inputClasses}
              aria-invalid="false"
              aria-describedby={describedBy}
              required={required}
              disabled={disabled}
              {...props}
            />
          )}
          {rightIcon && (
            <div
              className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500"
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && errorText && (
          <p
            id={errorId}
            className="mt-1 text-sm text-red-600 flex items-center"
            role="alert"
          >
            {errorText}
          </p>
        )}
        {!error && helperText && (
          <p
            id={helperId}
            className="mt-1 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;