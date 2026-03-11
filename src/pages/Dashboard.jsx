import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import FastingForm from '../components/forms/FastingForm';
import PrayerForm from '../components/forms/PrayerForm';
import TarawehForm from '../components/forms/TarawehForm';
import ReadingForm from '../components/forms/ReadingForm';
import NafileForm from '../components/forms/NafileForm';
import { useAuth } from '../contexts/AuthContext';
import { createActivity, upsertPrayerActivity, ACTIVITY_TYPES } from '../services/activityService';

export default function Dashboard() {
    const { currentUser, userProfile, isLocalMode, refreshProfile } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null);

    const openModal = (type) => {
        setModalType(type);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalType(null);
    };

    const refreshLocal = async () => {
        if (isLocalMode && refreshProfile) {
            refreshProfile();
        }
    };

    const handleSubmit = async ({ date, value }) => {
        try {
            if (modalType === ACTIVITY_TYPES.PRAYER) {
                await upsertPrayerActivity(currentUser.uid, date, value);
            } else {
                await createActivity(currentUser.uid, modalType, value, date);
            }
            await refreshLocal();
            closeModal();
        } catch (error) {
            console.error('Error creating activity:', error);
        }
    };

    const renderModalContent = () => {
        switch (modalType) {
            case ACTIVITY_TYPES.FASTING:
                return <FastingForm onSubmit={handleSubmit} onCancel={closeModal} />;
            case ACTIVITY_TYPES.PRAYER:
                return <PrayerForm onSubmit={handleSubmit} onCancel={closeModal} activities={[]} />;
            case ACTIVITY_TYPES.TARAWEH:
                return <TarawehForm onSubmit={handleSubmit} onCancel={closeModal} />;
            case ACTIVITY_TYPES.RISALE:
            case ACTIVITY_TYPES.PIRLANTA:
            case ACTIVITY_TYPES.QURAN:
            case ACTIVITY_TYPES.QURAN_MEAL:
                return <ReadingForm type={modalType} onSubmit={handleSubmit} onCancel={closeModal} />;
            case ACTIVITY_TYPES.NAFILE:
                return <NafileForm onSubmit={handleSubmit} onCancel={closeModal} />;
            default:
                return null;
        }
    };

    const getModalTitle = () => {
        const titles = {
            [ACTIVITY_TYPES.FASTING]: 'Add Fasting Entry',
            [ACTIVITY_TYPES.PRAYER]: 'Add Prayer Entry',
            [ACTIVITY_TYPES.TARAWEH]: 'Add Taraweh Entry',
            [ACTIVITY_TYPES.RISALE]: 'Add Risale Reading',
            [ACTIVITY_TYPES.PIRLANTA]: 'Add Pirlanta Reading',
            [ACTIVITY_TYPES.QURAN]: "Add Qur'an Reading",
            [ACTIVITY_TYPES.QURAN_MEAL]: "Add Qur'an Meal Reading",
            [ACTIVITY_TYPES.NAFILE]: 'Add Nafile Prayer'
        };
        return titles[modalType] || 'Add Entry';
    };

    return (
        <Layout>
            {isLocalMode && (
                <div className="mb-4 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm inline-block">
                    🔧 Local Testing Mode - Data stored in browser
                </div>
            )}

            {/* Total Points Card - Featured */}
            <div className="mb-10 glass-card bg-gradient-to-r from-primary-500/20 to-accent-500/20 border-primary-500/30">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-medium text-dark-300 mb-1">Total Points</h2>
                        <div className="text-5xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                            {userProfile?.points || 0}
                        </div>
                    </div>
                    <div className="text-6xl opacity-50">🏆</div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 text-sm text-dark-400">
                    <span className="mr-4">Fasting: 3pts/day</span>
                    <span className="mr-4">Taraweh: 3pts/day</span>
                    <span className="mr-4">Qur'an: 3pts/page</span>
                    <span className="mr-4">Risale/Pirlanta/Meal: 2pts/page</span>
                </div>
            </div>

            {/* Stats & Logs Section */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Stats & Logs</h2>
                    <Link to="/activity/all" className="text-sm text-dark-400 hover:text-white transition-colors">
                        View All →
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { type: 'fasting', icon: '🌙', label: 'Fasting', value: userProfile?.stats?.totalFasting || 0, sub: 'Days', border: 'border-primary-500/20 hover:border-primary-500/50' },
                        { type: 'prayer', icon: '🕌', label: 'Prayers', value: userProfile?.stats?.totalPrayers || 0, sub: 'Total', border: 'border-blue-500/20 hover:border-blue-500/50' },
                        { type: 'taraweh', icon: '✨', label: 'Taraweh', value: userProfile?.stats?.totalTaraweh || 0, sub: 'Days', border: 'border-purple-500/20 hover:border-purple-500/50' },
                        { type: 'risale', icon: '📖', label: 'Risale', value: userProfile?.stats?.risalePages || 0, sub: 'Pages', border: 'border-accent-500/20 hover:border-accent-500/50' },
                        { type: 'pirlanta', icon: '💎', label: 'Pirlanta', value: userProfile?.stats?.pirlantaPages || 0, sub: 'Pages', border: 'border-pink-500/20 hover:border-pink-500/50' },
                        { type: 'quran', icon: '📿', label: "Qur'an", value: userProfile?.stats?.quranPages || 0, sub: 'Pages', border: 'border-emerald-500/20 hover:border-emerald-500/50' },
                        { type: 'quran_meal', icon: '📚', label: "Qur'an Meal", value: userProfile?.stats?.quranMealPages || 0, sub: 'Pages', border: 'border-blue-400/20 hover:border-blue-400/50' },
                        { type: 'nafile', icon: '🤲', label: 'Nafile', value: userProfile?.stats?.totalNafile || 0, sub: 'Prayers', border: 'border-rose-500/20 hover:border-rose-500/50' },
                    ].map(item => (
                        <Link
                            key={item.type}
                            to={`/activity/${item.type}`}
                            className={`glass-card flex flex-col items-center text-center p-5 hover:bg-white/5 transition-all border ${item.border} group`}
                        >
                            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{item.icon}</span>
                            <span className="text-2xl font-bold text-white">{item.value}</span>
                            <span className="text-dark-400 text-sm">{item.label}</span>
                            <span className="text-dark-500 text-xs">{item.sub}</span>
                            <span className="mt-2 text-xs text-dark-500 group-hover:text-white transition-colors">View Log →</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* New Entry Section */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">New Entry</h2>
                <p className="text-dark-400 mb-4">Select an activity to record your progress</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <button onClick={() => openModal(ACTIVITY_TYPES.FASTING)} className="glass-card flex flex-col items-center justify-center p-8 hover:bg-white/5 transition-all border border-primary-500/20 hover:border-primary-500/50 group h-full">
                    <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">🌙</span>
                    <span className="font-medium text-white text-lg">Add Fasting</span>
                </button>
                <button onClick={() => openModal(ACTIVITY_TYPES.PRAYER)} className="glass-card flex flex-col items-center justify-center p-8 hover:bg-white/5 transition-all border border-blue-500/20 hover:border-blue-500/50 group h-full">
                    <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">🕌</span>
                    <span className="font-medium text-white text-lg">Add Prayer</span>
                </button>
                <button onClick={() => openModal(ACTIVITY_TYPES.TARAWEH)} className="glass-card flex flex-col items-center justify-center p-8 hover:bg-white/5 transition-all border border-purple-500/20 hover:border-purple-500/50 group h-full">
                    <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">✨</span>
                    <span className="font-medium text-white text-lg">Add Taraweh</span>
                </button>
                <button onClick={() => openModal(ACTIVITY_TYPES.RISALE)} className="glass-card flex flex-col items-center justify-center p-8 hover:bg-white/5 transition-all border border-accent-500/20 hover:border-accent-500/50 group h-full">
                    <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">📖</span>
                    <span className="font-medium text-white text-lg">Add Risale</span>
                </button>
                <button onClick={() => openModal(ACTIVITY_TYPES.PIRLANTA)} className="glass-card flex flex-col items-center justify-center p-8 hover:bg-white/5 transition-all border border-pink-500/20 hover:border-pink-500/50 group h-full">
                    <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">💎</span>
                    <span className="font-medium text-white text-lg">Add Pirlanta</span>
                </button>
                <button onClick={() => openModal(ACTIVITY_TYPES.QURAN)} className="glass-card flex flex-col items-center justify-center p-8 hover:bg-white/5 transition-all border border-emerald-500/20 hover:border-emerald-500/50 group h-full">
                    <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">📿</span>
                    <span className="font-medium text-white text-lg">Add Qur'an</span>
                </button>
                <button onClick={() => openModal(ACTIVITY_TYPES.QURAN_MEAL)} className="glass-card flex flex-col items-center justify-center p-8 hover:bg-white/5 transition-all border border-blue-400/20 hover:border-blue-400/50 group h-full">
                    <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">📚</span>
                    <span className="font-medium text-white text-lg">Add Meal</span>
                </button>
                <button onClick={() => openModal(ACTIVITY_TYPES.NAFILE)} className="glass-card flex flex-col items-center justify-center p-8 hover:bg-white/5 transition-all border border-rose-500/20 hover:border-rose-500/50 group h-full">
                    <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">🤲</span>
                    <span className="font-medium text-white text-lg">Add Nafile</span>
                </button>
            </div>

            <Modal isOpen={modalOpen} onClose={closeModal} title={getModalTitle()}>
                {renderModalContent()}
            </Modal>
        </Layout>
    );
}
