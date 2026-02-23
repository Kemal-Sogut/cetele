import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { getAllUsers, updateUserRole, assignStudentToMentor, initializeAllUserStats } from '../services/activityService';

export default function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [saving, setSaving] = useState(false);
    const [migrating, setMigrating] = useState(false);

    const loadUsers = useCallback(async () => {
        try {
            const allUsers = await getAllUsers();
            setUsers(allUsers);
            setMentors(allUsers.filter(u => u.role === 'mentor'));
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const openRoleModal = (user) => {
        setSelectedUser(user);
        setModalType('role');
        setModalOpen(true);
    };

    const openAssignModal = (user) => {
        setSelectedUser(user);
        setModalType('assign');
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedUser(null);
        setModalType(null);
    };

    const handleRoleChange = async (newRole) => {
        if (!selectedUser) return;

        setSaving(true);
        try {
            await updateUserRole(selectedUser.id, newRole);
            await loadUsers();
            closeModal();
        } catch (error) {
            console.error('Error updating role:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleAssignMentor = async (mentorId) => {
        if (!selectedUser) return;

        setSaving(true);
        try {
            await assignStudentToMentor(selectedUser.id, mentorId);
            await loadUsers();
            closeModal();
        } catch (error) {
            console.error('Error assigning mentor:', error);
        } finally {
            setSaving(false);
        }
    };

    const getRoleBadge = (role) => {
        const styles = {
            admin: 'bg-accent-500/20 text-accent-400 border-accent-500/30',
            mentor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            student: 'bg-primary-500/20 text-primary-400 border-primary-500/30'
        };
        return styles[role] || styles.student;
    };

    const getMentorName = (mentorId) => {
        const mentor = users.find(u => u.id === mentorId);
        return mentor ? mentor.displayName : 'Unassigned';
    };

    const handleRunMigration = async () => {
        if (!window.confirm('Are you sure you want to run the stats migration? This will calculate stats for all users and might take a while.')) return;
        setMigrating(true);
        try {
            const count = await initializeAllUserStats();
            alert(`Migration completed successfully for ${count} users.`);
            await loadUsers(); // Refresh to potentially show new data if needed
        } catch (error) {
            console.error('Error running migration:', error);
            alert('Migration failed. See console for details.');
        } finally {
            setMigrating(false);
        }
    };

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
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
                    <p className="text-dark-400">Manage users, roles, and mentor assignments</p>
                </div>
                <button
                    onClick={handleRunMigration}
                    disabled={migrating}
                    className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {migrating ? 'Migrating...' : 'Run Stats Migration'}
                </button>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="glass-card text-center">
                    <div className="text-3xl font-bold text-primary-400">{users.filter(u => u.role === 'student').length}</div>
                    <div className="text-dark-400">Students</div>
                </div>
                <div className="glass-card text-center">
                    <div className="text-3xl font-bold text-blue-400">{users.filter(u => u.role === 'mentor').length}</div>
                    <div className="text-dark-400">Mentors</div>
                </div>
                <div className="glass-card text-center">
                    <div className="text-3xl font-bold text-accent-400">{users.filter(u => u.role === 'admin').length}</div>
                    <div className="text-dark-400">Admins</div>
                </div>
            </div>

            {/* Users Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-dark-600">
                                <th className="text-left py-4 px-4 text-dark-300 font-medium">Name</th>
                                <th className="text-left py-4 px-4 text-dark-300 font-medium">Email</th>
                                <th className="text-left py-4 px-4 text-dark-300 font-medium">Role</th>
                                <th className="text-left py-4 px-4 text-dark-300 font-medium">Mentor</th>
                                <th className="text-right py-4 px-4 text-dark-300 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                                    <td className="py-4 px-4 text-white font-medium">{user.displayName}</td>
                                    <td className="py-4 px-4 text-dark-300">{user.email}</td>
                                    <td className="py-4 px-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-dark-300">
                                        {user.role === 'student' ? getMentorName(user.mentorId) : '-'}
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => openRoleModal(user)}
                                                className="px-3 py-1 rounded-lg text-sm bg-dark-700/50 text-dark-300 hover:bg-dark-600/50 hover:text-white transition-colors"
                                            >
                                                Change Role
                                            </button>
                                            {user.role === 'student' && (
                                                <button
                                                    onClick={() => openAssignModal(user)}
                                                    className="px-3 py-1 rounded-lg text-sm bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors"
                                                >
                                                    Assign Mentor
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Role Change Modal */}
            <Modal
                isOpen={modalOpen && modalType === 'role'}
                onClose={closeModal}
                title={`Change Role: ${selectedUser?.displayName}`}
            >
                <div className="space-y-3">
                    {['student', 'mentor', 'admin'].map((role) => (
                        <button
                            key={role}
                            onClick={() => handleRoleChange(role)}
                            disabled={saving || selectedUser?.role === role}
                            className={`w-full py-3 px-4 rounded-xl text-left font-medium transition-all ${selectedUser?.role === role
                                ? 'bg-primary-500 text-white'
                                : 'bg-dark-700/50 text-dark-300 hover:bg-dark-600/50 hover:text-white'
                                } disabled:opacity-50`}
                        >
                            <span className="capitalize">{role}</span>
                            {selectedUser?.role === role && <span className="ml-2">(current)</span>}
                        </button>
                    ))}
                </div>
                <div className="mt-6">
                    <Button variant="secondary" onClick={closeModal} className="w-full">
                        Cancel
                    </Button>
                </div>
            </Modal>

            {/* Assign Mentor Modal */}
            <Modal
                isOpen={modalOpen && modalType === 'assign'}
                onClose={closeModal}
                title={`Assign Mentor: ${selectedUser?.displayName}`}
            >
                <div className="space-y-3 max-h-60 overflow-y-auto">
                    <button
                        onClick={() => handleAssignMentor(null)}
                        disabled={saving}
                        className="w-full py-3 px-4 rounded-xl text-left font-medium bg-dark-700/50 text-dark-300 hover:bg-dark-600/50 hover:text-white transition-all disabled:opacity-50"
                    >
                        Unassign Mentor
                    </button>
                    {mentors.map((mentor) => (
                        <button
                            key={mentor.id}
                            onClick={() => handleAssignMentor(mentor.id)}
                            disabled={saving}
                            className={`w-full py-3 px-4 rounded-xl text-left font-medium transition-all ${selectedUser?.mentorId === mentor.id
                                ? 'bg-primary-500 text-white'
                                : 'bg-dark-700/50 text-dark-300 hover:bg-dark-600/50 hover:text-white'
                                } disabled:opacity-50`}
                        >
                            {mentor.displayName}
                            {selectedUser?.mentorId === mentor.id && <span className="ml-2">(current)</span>}
                        </button>
                    ))}
                    {mentors.length === 0 && (
                        <p className="text-dark-400 text-center py-4">No mentors available. Promote a user to mentor first.</p>
                    )}
                </div>
                <div className="mt-6">
                    <Button variant="secondary" onClick={closeModal} className="w-full">
                        Cancel
                    </Button>
                </div>
            </Modal>
        </Layout>
    );
}
