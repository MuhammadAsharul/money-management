'use client';

import { ReactNode } from 'react';

interface TooltipProps {
    children: ReactNode;
    content: string;
}

export default function Tooltip({ children, content }: TooltipProps) {
    return (
        <div className="relative group flex flex-col items-center">
            {children}
            <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center animate-fadeIn whitespace-nowrap z-50">
                <div className="bg-slate-800 dark:bg-slate-700 text-white text-xs py-1 px-2 rounded shadow-lg">
                    {content}
                </div>
                <div className="w-2 h-2 -mt-1 bg-slate-800 dark:bg-slate-700 rotate-45 transform"></div>
            </div>
        </div>
    );
}
