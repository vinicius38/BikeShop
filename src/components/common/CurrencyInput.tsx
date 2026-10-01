import React, { useState, useEffect } from 'react';
import { maskCurrency, formatCurrencyTwoDecimals, parseCurrency } from '../../utils/maskUtils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | string | null | undefined;
  onChangeValue: (value: number, rawString: string) => void;
  prefix?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChangeValue,
  prefix = 'R$',
  className = '',
  placeholder = '0,00',
  onBlur,
  onFocus,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (value === null || value === undefined || value === '') return '';
    return formatCurrencyTwoDecimals(value);
  });

  useEffect(() => {
    if (value === null || value === undefined || value === '') {
      setDisplayValue('');
    } else {
      const currentNum = parseCurrency(displayValue);
      const incomingNum = typeof value === 'number' ? value : parseCurrency(value);
      if (currentNum !== incomingNum) {
        setDisplayValue(formatCurrencyTwoDecimals(incomingNum));
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCurrency(e.target.value);
    setDisplayValue(masked);
    const num = parseCurrency(masked);
    onChangeValue(num, masked);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (displayValue.trim() !== '') {
      const formatted = formatCurrencyTwoDecimals(displayValue);
      setDisplayValue(formatted);
      onChangeValue(parseCurrency(formatted), formatted);
    }
    if (onBlur) {
      onBlur(e);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // If value is 0,00, select all so the user can just type
    if (displayValue === '0,00') {
      e.target.select();
    }
    if (onFocus) {
      onFocus(e);
    }
  };

  return (
    <div className="relative flex items-center w-full">
      {prefix && (
        <span className="absolute left-3 text-xs text-[#ACB0B0] font-mono pointer-events-none select-none">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={`${prefix ? 'pl-9' : 'pl-3'} pr-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white font-mono outline-hidden focus:border-[#EF7410] w-full ${className}`}
        {...props}
      />
    </div>
  );
};
