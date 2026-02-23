import { useState, useMemo, useRef, useEffect } from 'react';

export default function StudentSelector({ students, selectedStudent, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef(null);

    const selected = students.find(s => s.id === selectedStudent);

    // Filter students based on search query
    const filteredStudents = useMemo(() => {
        if (!searchQuery.trim()) return students;
        const query = searchQuery.toLowerCase();
        return students.filter(student =>
            student.displayName?.toLowerCase().includes(query) ||
            student.email?.toLowerCase().includes(query)
        );
    }, [students, searchQuery]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    // Clear search when dropdown closes
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-dark-800/50 border border-dark-600 hover:border-primary-500/50 transition-colors"
            >
                <span className="text-white">
                    {selected ? selected.displayName : 'Select a student'}
                </span>
                <svg
                    className={`w-5 h-5 text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-dark-800 border border-dark-600 shadow-xl z-[100] overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-dark-600">
                        <div className="relative">
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search students..."
                                className="w-full pl-9 pr-4 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 text-sm focus:outline-none focus:border-primary-500/50 transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Student List */}
                    <div className="py-2 max-h-60 overflow-y-auto">
                        {!searchQuery && (
                            <button
                                onClick={() => {
                                    onSelect(null);
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-2 text-left text-dark-400 hover:bg-dark-700/50 hover:text-white transition-colors"
                            >
                                -- Select a student --
                            </button>
                        )}
                        {filteredStudents.map((student) => (
                            <button
                                key={student.id}
                                onClick={() => {
                                    onSelect(student.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left transition-colors ${selectedStudent === student.id
                                    ? 'bg-primary-500/20 text-primary-400'
                                    : 'text-white hover:bg-dark-700/50'
                                    }`}
                            >
                                <span className="font-medium">{student.displayName}</span>
                                <span className="text-dark-400 text-sm ml-2">{student.email}</span>
                            </button>
                        ))}
                        {filteredStudents.length === 0 && searchQuery && (
                            <p className="px-4 py-3 text-dark-400 text-sm text-center">
                                No students found matching "{searchQuery}"
                            </p>
                        )}
                        {students.length === 0 && (
                            <p className="px-4 py-2 text-dark-400 text-sm">No students assigned</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
