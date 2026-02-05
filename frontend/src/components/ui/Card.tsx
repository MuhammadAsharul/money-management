import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    noPadding?: boolean;
    hoverEffect?: boolean;
    variant?: 'default' | 'glass' | 'outlined';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', noPadding = false, hoverEffect = false, variant = 'default', children, ...props }, ref) => {
        const baseStyles = "rounded-xl transition-all shadow-sm relative overflow-hidden";

        const variants = {
            default: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
            glass: "glass border-0 shadow-lg backdrop-blur-md",
            outlined: "bg-transparent border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
        };

        return (
            <div
                ref={ref}
                className={`
                    ${baseStyles}
                    ${variants[variant] || variants.default}
                    ${hoverEffect ? 'hover-lift cursor-pointer' : ''}
                    ${noPadding ? '' : 'p-6'}
                    ${className}
                `}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";
