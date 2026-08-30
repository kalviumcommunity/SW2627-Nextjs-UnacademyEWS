import React from "react";

export type MetricColor = "neutral" | "red" | "yellow" | "green";

export interface MetricCardProps {
    title: string;
    value: string | number;
    color?: MetricColor;
    icon?: React.ReactNode;
    subtitle?: string;
    className?: string;
}

const colorStyles: Record<
    MetricColor,
    {
        iconWrapper: string;
        accentText: string;
    }
> = {
    neutral: {
        iconWrapper: "bg-zinc-100 text-zinc-600",
        accentText: "text-zinc-500",
    },
    red: {
        iconWrapper: "bg-red-50 text-red-600",
        accentText: "text-red-500",
    },
    yellow: {
        iconWrapper: "bg-amber-50 text-amber-600",
        accentText: "text-amber-500",
    },
    green: {
        iconWrapper: "bg-emerald-50 text-emerald-600",
        accentText: "text-emerald-500",
    },
};

export default function MetricCard({
    title,
    value,
    color = "neutral",
    icon,
    subtitle,
    className = "",
}: MetricCardProps) {
    const activeColor = colorStyles[color] || colorStyles.neutral;

    return (
        <div
            className={`rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition-all hover:shadow-sm ${className}`}
        >
            <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-medium text-zinc-500">
                    {title}
                </p>
                {icon && (
                    <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${activeColor.iconWrapper}`}
                    >
                        {icon}
                    </div>
                )}
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-zinc-900 mt-2">
                {value}
            </p>
            {subtitle && (
                <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>
            )}
        </div>
    );
}
