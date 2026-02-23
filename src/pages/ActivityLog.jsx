import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import StatsCard from '../components/dashboard/StatsCard';
import { useAuth } from '../contexts/AuthContext';
import { getPaginatedActivities, deleteActivity } from '../services/activityService';
import { formatDate } from '../utils/calculations';

const ITEMS_PER_PAGE = 20;

const TYPE_CONFIG = {
    all: { title: 'All Activities', icon: '📊', color: 'primary' },
    fasting: { title: 'Fasting', icon: '🌙', color: 'primary' },
    prayer: { title: 'Daily Prayers', icon: '🕌', color: 'blue' },
    taraweh: { title: 'Taraweh', icon: '✨', color: 'purple' },
    risale: { title: 'Risale Reading', icon: '📖', color: 'accent' },
    pirlanta: { title: 'Pirlanta Reading', icon: '💎', color: 'pink' },
    quran: { title: "Qur'an Reading", icon: '📿', color: 'emerald' },
    quran_meal: { title: "Qur'an Meal", icon: '📚', color: 'blue' },
    nafile: { title: 'Nafile Prayers', icon: '🤲', color: 'rose' }
};

export default function ActivityLog() {
    const { type } = useParams();
    const { currentUser, userProfile } = useAuth();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    const config = TYPE_CONFIG[type] || TYPE_CONFIG['all'];

    const loadInitialActivities = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const { data, lastVisible: lastVis, hasMore: more } = await getPaginatedActivities(currentUser.uid, {
                type: type === 'all' ? null : type,
                limit: ITEMS_PER_PAGE
            });
            setActivities(data);
            setLastVisible(lastVis);
            setHasMore(more);
        } catch (error) {
            console.error('Error loading activities:', error);
        } finally {
            setLoading(false);
        }
    }, [currentUser, type]);

    useEffect(() => {
        loadInitialActivities();
    }, [loadInitialActivities]);

    const loadMore = async () => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        try {
            const { data, lastVisible: lastVis, hasMore: more } = await getPaginatedActivities(currentUser.uid, {
                type: type === 'all' ? null : type,
                limit: ITEMS_PER_PAGE,
                lastVisible,
                // for local mode we use offset
                offset: lastVisible
            });
            setActivities(prev => [...prev, ...data]);
            setLastVisible(lastVis);
            setHasMore(more);
        } catch (error) {
            console.error('Error loading more activities:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleDelete = async (activityId) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try {
            await deleteActivity(activityId, currentUser.uid);
            await loadInitialActivities();
        } catch (error) {
            console.error('Error deleting activity:', error);
        }
    };

    const renderValue = (activity) => {
        switch (activity.type) {
            case 'fasting':
                return activity.value ? (
                    <span className="text-primary-400">✓ Fasted</span>
                ) : (
                    <span className="text-red-400">✗ Not fasted</span>
                );
            case 'prayer':
                return <span className="text-blue-400 font-medium">{Array.isArray(activity.value) ? activity.value.join(', ') : activity.value}</span>;
            case 'taraweh':
                return (
                    <span className={activity.value >= 10 ? 'text-purple-400' : 'text-dark-400'}>
                        {activity.value} rakats
                    </span>
                );
            case 'risale':
            case 'pirlanta':
                return <span className="text-accent-400">{activity.value} pages</span>;
            case 'quran':
                return <span className="text-emerald-400">{activity.value} pages</span>;
            case 'quran_meal':
                return <span className="text-blue-400">{activity.value} pages</span>;
            case 'nafile':
                return <span className="text-rose-400">{activity.value} prayers</span>;
            default:
                return <span className="text-white">{String(activity.value)}</span>;
        }
    };

    // Extract stats safely
    const stats = userProfile?.stats || {};

    // For weekly prayers, the generic stats logic tracks totalPrayers. We can display that instead of weekly if needed,
    // or keep it named "Total Prayers" since we aren't re-fetching 7 days here.
    const totalPrayers = stats.totalPrayers || 0;

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="flex items-center gap-4 mb-8">
                <Link
                    to="/dashboard"
                    className="p-2 rounded-lg bg-dark-700/50 text-dark-300 hover:text-white hover:bg-dark-600/50 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{config.icon}</span>
                    <div>
                        <h1 className="text-3xl font-bold text-white">{config.title}</h1>
                        <p className="text-dark-400">Activity History</p>
                    </div>
                </div>
            </div>

            {/* Lifetime Stats */}
            {(type === 'all' || !type) && (
                <div className="mb-10">
                    <h2 className="text-xl font-bold text-white mb-4">Lifetime Statistics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        <StatsCard
                            icon={<span className="text-xl">🌙</span>}
                            label="Fasting"
                            value={stats.totalFasting || 0}
                            color="primary"
                        />
                        <StatsCard
                            icon={<span className="text-xl">🕌</span>}
                            label="Prayers"
                            value={totalPrayers}
                            color="blue"
                            subtext="Total"
                        />
                        <StatsCard
                            icon={<span className="text-xl">✨</span>}
                            label="Taraweh"
                            value={stats.totalTaraweh || 0}
                            color="purple"
                        />
                        <StatsCard
                            icon={<span className="text-xl">📖</span>}
                            label="Risale"
                            value={stats.risalePages || 0}
                            color="accent"
                            subtext="Pages"
                        />
                        <StatsCard
                            icon={<span className="text-xl">💎</span>}
                            label="Pirlanta"
                            value={stats.pirlantaPages || 0}
                            color="pink"
                            subtext="Pages"
                        />
                        <StatsCard
                            icon={<span className="text-xl">📿</span>}
                            label="Qur'an"
                            value={stats.quranPages || 0}
                            color="emerald"
                            subtext="Pages"
                        />
                        <StatsCard
                            icon={<span className="text-xl">📚</span>}
                            label="Qur'an Meal"
                            value={stats.quranMealPages || 0}
                            color="blue"
                            subtext="Pages"
                        />
                        <StatsCard
                            icon={<span className="text-xl">🤲</span>}
                            label="Nafile"
                            value={stats.totalNafile || 0}
                            color="rose"
                            subtext="Prayers"
                        />
                    </div>
                </div>
            )}

            <div className="glass-card">
                {activities.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="text-6xl mb-4 block">{config.icon}</span>
                        <p className="text-dark-400">No entries yet</p>
                        <Link
                            to="/dashboard"
                            className="inline-block mt-4 text-primary-400 hover:text-primary-300"
                        >
                            ← Back to Dashboard
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            {activities.map((activity, index) => (
                                <div
                                    key={activity.id || index}
                                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-dark-800/30 hover:bg-dark-700/30 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-dark-400 text-sm min-w-[100px] flex gap-2 items-center">
                                            {TYPE_CONFIG[activity.type]?.icon} {formatDate(activity.date)}
                                        </span>
                                        {renderValue(activity)}
                                    </div>
                                    {activity.id && (
                                        <button
                                            onClick={() => handleDelete(activity.id)}
                                            className="p-1 rounded text-dark-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Delete entry"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {hasMore && (
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="mt-6 w-full py-3 rounded-xl bg-dark-700/50 text-dark-300 hover:text-white hover:bg-dark-600/50 transition-colors font-medium flex justify-center items-center gap-2"
                            >
                                {loadingMore ? (
                                    <span className="w-5 h-5 border-2 border-dark-400 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    'Load More'
                                )}
                            </button>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
}
