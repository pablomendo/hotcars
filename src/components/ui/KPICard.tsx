interface KPICardProps {
    title: string;
    value: string | number;
    subtext?: string;
    highlight?: 'success' | 'warning' | 'error' | 'neutral';
}

export default function KPICard({ title, value, subtext, highlight = 'neutral' }: KPICardProps) {
    const colors = {
        success: 'text-success',
        warning: 'text-warning',
        error: 'text-error',
        neutral: 'text-white'
    };

    return (
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between h-32">
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider">{title}</h3>
            <div>
                <span className={`text-3xl font-bold ${colors[highlight]}`}>{value}</span>
                {subtext && <p className="text-xs text-text-secondary mt-1">{subtext}</p>}
            </div>
        </div>
    );
}
