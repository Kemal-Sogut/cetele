import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import StatsCard from '../components/dashboard/StatsCard';
import StudentSelector from '../components/dashboard/StudentSelector';
import { useAuth } from '../contexts/AuthContext';
import { getAssignedStudents, getUserActivities, getAllUsers, deleteActivity } from '../services/activityService';
import { calculateAllStats, formatDate, groupActivitiesByDate, parseLocalDate } from '../utils/calculations';

export default function MentorDashboard() {
    const { currentUser, isAdmin } = useAuth();
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentActivities, setStudentActivities] = useState([]);
    const [showDetails, setShowDetails] = useState(false);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('students'); // 'students' or 'personal'

    const loadStudents = useCallback(async () => {
        if (!currentUser) return;

        try {
            let studentList;
            if (isAdmin) {
                // Admins can see all students
                const allUsers = await getAllUsers();
                studentList = allUsers.filter(u => u.role === 'student' || u.role === 'mentor');
            } else {
                // Mentors see only assigned students
                studentList = await getAssignedStudents(currentUser.uid);
            }
            setStudents(studentList);
        } catch (error) {
            console.error('Error loading students:', error);
        } finally {
            setLoading(false);
        }
    }, [currentUser, isAdmin]);

    const loadStudentData = useCallback(async () => {
        if (!selectedStudent || !showDetails) {
            return;
        }

        try {
            // use getPaginatedActivities to limit reads
            const { getPaginatedActivities } = await import('../services/activityService');
            const { data } = await getPaginatedActivities(selectedStudent, { limit: 30 });
            setStudentActivities(data);
        } catch (error) {
            console.error('Error loading student data:', error);
        }
    }, [selectedStudent, showDetails]);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    useEffect(() => {
        loadStudentData();
    }, [loadStudentData]);

    const handleDelete = async (activityId) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try {
            await deleteActivity(activityId);
            await loadStudentData();
        } catch (error) {
            console.error('Error deleting activity:', error);
        }
    };

    const groupedActivities = groupActivitiesByDate(studentActivities);
    const sortedDates = Object.keys(groupedActivities).sort((a, b) => parseLocalDate(b) - parseLocalDate(a));

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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {isAdmin ? 'Admin Dashboard' : 'Mentor Dashboard'}
                    </h1>
                    <p className="text-dark-400">Monitor your students' spiritual progress</p>
                </div>

                {/* View toggle */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('students')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${viewMode === 'students'
                            ? 'bg-primary-500 text-white'
                            : 'bg-dark-700/50 text-dark-300 hover:bg-dark-600/50'
                            }`}
                    >
                        Students
                    </button>
                    <Link
                        to="/dashboard"
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-dark-700/50 text-dark-300 hover:bg-dark-600/50 transition-all"
                    >
                        My Cetele
                    </Link>
                </div>
            </div>

            {/* Student Selector */}
            <div className="glass-card mb-6 relative z-[60]" style={{ transform: 'none' }}>
                <label className="block text-sm font-medium text-dark-300 mb-3">Select Student</label>
                {students.length === 0 && !isAdmin ? (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-4">📋</div>
                        <p className="text-dark-300 mb-2">No students assigned to you yet</p>
                        <p className="text-dark-400 text-sm">Contact your admin to have students assigned to your mentorship.</p>
                    </div>
                ) : (
                    <StudentSelector
                        students={students}
                        selectedStudent={selectedStudent}
                        onSelect={setSelectedStudent}
                    />
                )}
            </div>

            {/* Student Stats */}
            {selectedStudent && (
                <>
                    {/* Points Card - Full Width */}
                    <div className="mb-6">
                        <StatsCard
                            icon={<span className="text-xl">🏆</span>}
                            label="Points"
                            value={students.find(s => s.id === selectedStudent)?.points || 0}
                            color="accent"
                        />
                    </div>

                    {(() => {
                        const studentObj = students.find(s => s.id === selectedStudent);
                        const stats = studentObj?.stats || {};
                        return (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
                                <StatsCard
                                    icon={<span className="text-xl">🌙</span>}
                                    label="Fasting"
                                    value={stats.totalFasting || 0}
                                    color="primary"
                                />
                                <StatsCard
                                    icon={<span className="text-xl">🕌</span>}
                                    label="Prayers"
                                    value={stats.totalPrayers || 0}
                                    color="blue"
                                />
                                <StatsCard
                                    icon={<span className="text-xl">🤲</span>}
                                    label="Extra Prayers"
                                    value={stats.totalNafile || 0}
                                    color="rose"
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
                                />
                                <StatsCard
                                    icon={<span className="text-xl">💎</span>}
                                    label="Pirlanta"
                                    value={stats.pirlantaPages || 0}
                                    color="pink"
                                />
                                <StatsCard
                                    icon={<span className="text-xl">📿</span>}
                                    label="Qur'an"
                                    value={stats.quranPages || 0}
                                    color="emerald"
                                />
                                <StatsCard
                                    icon={<span className="text-xl">📚</span>}
                                    label="Qur'an Meal"
                                    value={stats.quranMealPages || 0}
                                    color="blue"
                                />
                            </div>
                        );
                    })()}

                    {/* See Details toggle */}
                    <div className="glass-card">
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors font-medium"
                        >
                            <svg
                                className={`w-5 h-5 transition-transform ${showDetails ? 'rotate-90' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            {showDetails ? 'Hide Details' : 'See Details'}
                        </button>

                        {showDetails && (
                            <div className="mt-6 space-y-4">
                                {sortedDates.length === 0 ? (
                                    <p className="text-dark-400 text-center py-4">No activity data available</p>
                                ) : (
                                    sortedDates.slice(0, 14).map(date => (
                                        <div key={date} className="border-l-2 border-primary-500/30 pl-4">
                                            <h4 className="text-white font-medium mb-2">{formatDate(parseLocalDate(date))}</h4>
                                            <div className="space-y-1">
                                                {groupedActivities[date].map((activity, idx) => (
                                                    <div key={activity.id || idx} className="flex items-center justify-between py-1 px-2 rounded hover:bg-dark-700/30 transition-colors group">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-dark-400 capitalize">{activity.type}:</span>
                                                            <span className="text-white">{renderActivityValue(activity)}</span>
                                                        </div>
                                                        {activity.id && (
                                                            <button
                                                                onClick={() => handleDelete(activity.id)}
                                                                className="p-1 rounded text-dark-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                                                title="Delete entry"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </>
            )
            }
        </Layout >
    );
}

function renderActivityValue(activity) {
    switch (activity.type) {
        case 'fasting':
            return activity.value ? '✓ Fasted' : '✗ Not fasted';
        case 'prayer':
            return Array.isArray(activity.value) ? activity.value.join(', ') : activity.value;
        case 'taraweh':
            return `${activity.value} rakats`;
        case 'risale':
        case 'pirlanta':
        case 'quran':
        case 'quran_meal':
            return `${activity.value} pages`;
        case 'nafile':
            return `${activity.value} prayers`;
        default:
            return String(activity.value);
    }
}
