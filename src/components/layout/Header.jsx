import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { userProfile, logout } = useAuth();
    const location = useLocation();

    const getRoleBadge = () => {
        const roles = {
            admin: { text: 'Admin', class: 'bg-accent-500/20 text-accent-400 border-accent-500/30' },
            mentor: { text: 'Mentor', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            student: { text: 'Student', class: 'bg-primary-500/20 text-primary-400 border-primary-500/30' }
        };
        return roles[userProfile?.role] || roles.student;
    };

    const badge = getRoleBadge();

    return (
        <>
            <header className="glass border-b border-dark-700/50 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/dashboard" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                                <span className="text-xl font-bold text-white">C</span>
                            </div>
                            <span className="text-xl font-bold text-white hidden sm:block">Cetele</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            <NavLink to="/dashboard" current={location.pathname === '/dashboard'}>
                                Dashboard
                            </NavLink>
                            {(userProfile?.role === 'mentor' || userProfile?.role === 'admin') && (
                                <NavLink to="/mentor" current={location.pathname === '/mentor'}>
                                    Students
                                </NavLink>
                            )}
                            {userProfile?.role === 'admin' && (
                                <NavLink to="/admin" current={location.pathname === '/admin'}>
                                    Admin
                                </NavLink>
                            )}
                        </nav>

                        {/* User section */}
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badge.class}`}>
                                    {badge.text}
                                </span>
                                <span className="text-dark-300 text-sm">{userProfile?.displayName}</span>
                            </div>
                            <button
                                onClick={logout}
                                className="hidden md:block p-2 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors"
                                title="Sign out"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>

                            {/* Hamburger Menu Button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors"
                                aria-label="Toggle menu"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {mobileMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Menu Drawer */}
            <div className={`fixed top-0 right-0 w-64 h-full bg-dark-800/95 backdrop-blur-xl border-l border-dark-700/50 z-[210] transform transition-transform duration-300 ease-in-out md:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full p-4 pt-2">
                    {/* User Info */}
                    <div className="flex items-center gap-3 pb-4 border-b border-dark-700/50">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                                {userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{userProfile?.displayName}</p>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${badge.class}`}>
                                {badge.text}
                            </span>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex flex-col gap-1 py-4 flex-1">
                        <MobileNavLink
                            to="/dashboard"
                            current={location.pathname === '/dashboard'}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Dashboard
                        </MobileNavLink>
                        {(userProfile?.role === 'mentor' || userProfile?.role === 'admin') && (
                            <MobileNavLink
                                to="/mentor"
                                current={location.pathname === '/mentor'}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                Students
                            </MobileNavLink>
                        )}
                        {userProfile?.role === 'admin' && (
                            <MobileNavLink
                                to="/admin"
                                current={location.pathname === '/admin'}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Admin
                            </MobileNavLink>
                        )}
                    </nav>

                    {/* Logout Button */}
                    <button
                        onClick={() => {
                            setMobileMenuOpen(false);
                            logout();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </div>
        </>
    );
}

function NavLink({ to, current, children }) {
    return (
        <Link
            to={to}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${current
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
                }`}
        >
            {children}
        </Link>
    );
}

function MobileNavLink({ to, current, onClick, children }) {
    return (
        <Link
            to={to}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${current
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
                }`}
        >
            {children}
        </Link>
    );
}
