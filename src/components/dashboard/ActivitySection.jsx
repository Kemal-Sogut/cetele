import { Link } from 'react-router-dom';
import Button from '../common/Button';
import { formatDate } from '../../utils/calculations';

export default function ActivitySection({
    title,
    icon,
    color = 'primary',
    activities = [],
    activityType,
    onAdd,
    onDelete,
    renderItem,
    emptyMessage = 'No entries yet'
}) {
    // Show only the last 3 entries
    const displayActivities = activities.slice(0, 3);

    const colorClasses = {
        primary: 'border-primary-500/30',
        accent: 'border-accent-500/30',
        blue: 'border-blue-500/30',
        purple: 'border-purple-500/30',
        pink: 'border-pink-500/30',
        rose: 'border-rose-500/30',
        emerald: 'border-emerald-500/30'
    };

    const iconBgClasses = {
        primary: 'bg-primary-500/20 text-primary-400',
        accent: 'bg-accent-500/20 text-accent-400',
        blue: 'bg-blue-500/20 text-blue-400',
        purple: 'bg-purple-500/20 text-purple-400',
        pink: 'bg-pink-500/20 text-pink-400',
        rose: 'bg-rose-500/20 text-rose-400',
        emerald: 'bg-emerald-500/20 text-emerald-400'
    };

    return (
        <div className={`glass-card border-l-4 ${colorClasses[color]}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${iconBgClasses[color]}`}>
                        {icon}
                    </div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    {activities.length > 0 && (
                        <span className="text-dark-400 text-sm">({activities.length})</span>
                    )}
                </div>
                <Button onClick={onAdd} variant="secondary" className="!py-2 !px-4 text-sm">
                    + Add
                </Button>
            </div>

            {/* Activity list */}
            <div className="space-y-2">
                {displayActivities.length === 0 ? (
                    <p className="text-dark-400 text-sm py-4 text-center">{emptyMessage}</p>
                ) : (
                    displayActivities.map((activity, index) => (
                        <div
                            key={activity.id || index}
                            className="flex items-center justify-between py-2 px-3 rounded-lg bg-dark-800/30 hover:bg-dark-700/30 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-dark-400 text-sm">{formatDate(activity.date)}</span>
                                {renderItem ? renderItem(activity) : (
                                    <span className="text-white">{String(activity.value)}</span>
                                )}
                            </div>
                            {onDelete && activity.id && (
                                <button
                                    onClick={() => onDelete(activity.id)}
                                    className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    title="Delete entry"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* See more link */}
            {activities.length > 3 && activityType && (
                <Link
                    to={`/activity/${activityType}`}
                    className="mt-4 inline-flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                    See all {activities.length} entries
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            )}
        </div>
    );
}
