import { HTMLAttributes, forwardRef } from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'info' | 'success' | 'warning' | 'error';
    title?: string;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
    ({ className = '', variant = 'info', title, children, ...props }, ref) => {

        const variants = {
            info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300",
            success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300",
            warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300",
            error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300",
        };

        const icons = {
            info: <Info className="h-4 w-4" />,
            success: <CheckCircle2 className="h-4 w-4" />,
            warning: <AlertCircle className="h-4 w-4" />,
            error: <XCircle className="h-4 w-4" />,
        };

        return (
            <div
                ref={ref}
                className={`relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-current ${variants[variant]} ${className}`}
                role="alert"
                {...props}
            >
                {icons[variant]}
                {title && <h5 className="mb-1 font-medium leading-none tracking-tight">{title}</h5>}
                <div className="text-sm opacity-90">{children}</div>
            </div>
        );
    }
);

Alert.displayName = "Alert";
