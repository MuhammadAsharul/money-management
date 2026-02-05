'use client';

import { useState, useEffect, ChangeEvent } from 'react';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: number | string;
    onValueChange: (value: number) => void;
}

export default function CurrencyInput({ value, onValueChange, className, ...props }: CurrencyInputProps) {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        // Update display value when prop value changes externally
        if (value === 0 || value === '0' || !value) {
            setDisplayValue('');
        } else {
            // Format existing value
            setDisplayValue(formatCurrency(Number(value)));
        }
    }, [value]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^0-9]/g, '');

        if (rawValue === '') {
            setDisplayValue('');
            onValueChange(0);
            return;
        }

        const numericValue = parseInt(rawValue, 10);
        onValueChange(numericValue);

        // We set display value immediately to show formatted output while typing
        // Note: The cursor position might jump to end, for simple inputs usually fine.
        // For formatted currency input handling cursor is complex,
        // but for this dashboard a simple replacement is often acceptable.
        // Or we can just let React update it via useEffect if we want specific cursor behavior,
        // but that causes lag/jumps.
        // Let's try controlling it locally but formatting the raw input.

        // Actually best way for simple implementation:
        // User types, we format.
    };

    return (
        <input
            {...props}
            type="text"
            className={className}
            value={displayValue}
            onChange={handleChange}
            placeholder="Rp 0"
        />
    );
}
