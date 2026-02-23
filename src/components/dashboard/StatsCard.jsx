export default function StatsCard({ icon, label, value, subtext, color = 'primary' }) {
    const colors = {
        primary: 'from-primary-500 to-primary-600',
        accent: 'from-accent-500 to-accent-600',
        blue: 'from-blue-500 to-blue-600',
        purple: 'from-purple-500 to-purple-600',
        pink: 'from-pink-500 to-pink-600',
        rose: 'from-rose-500 to-rose-600',
        emerald: 'from-emerald-500 to-emerald-600'
    };

    const iconColors = {
        primary: 'text-primary-400',
        accent: 'text-accent-400',
        blue: 'text-blue-400',
        purple: 'text-purple-400',
        pink: 'text-pink-400',
        rose: 'text-rose-400',
        emerald: 'text-emerald-400'
    };

    return (
        <div className="glass-card group">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color]} shadow-lg`}>
                    {icon}
                </div>
                <div className={`${iconColors[color]} opacity-20 group-hover:opacity-40 transition-opacity`}>
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>

            <div className="stat-value mb-1">{value}</div>
            <div className="text-dark-300 font-medium">{label}</div>
            {subtext && (
                <div className="text-dark-500 text-sm mt-1">{subtext}</div>
            )}
        </div>
    );
}
