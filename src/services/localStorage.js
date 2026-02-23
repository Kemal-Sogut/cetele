// Local Storage Service for testing without Firebase
// This provides the same interface as Firebase but stores data locally

import { toLocalDateString, parseLocalDate } from '../utils/calculations';

const STORAGE_KEYS = {
    USERS: 'cetele_users',
    ACTIVITIES: 'cetele_activities',
    CURRENT_USER: 'cetele_current_user'
};

// Initialize storage with empty arrays if not exists
function initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
        localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify([]));
    }
}

// Generate unique ID
function generateId() {
    return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// User methods
export function getUsers() {
    initStorage();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
}

export function getUserById(userId) {
    const users = getUsers();
    return users.find(u => u.id === userId) || null;
}

export function createUser(userData) {
    const users = getUsers();
    const newUser = {
        id: generateId(),
        ...userData,
        points: userData.points || 0,
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return newUser;
}

export function updateUser(userId, updates) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        return users[index];
    }
    return null;
}

export function findUserByEmail(email) {
    const users = getUsers();
    return users.find(u => u.email === email) || null;
}

// Auth methods
export function getCurrentUser() {
    const userId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (userId) {
        return getUserById(userId);
    }
    return null;
}

export function setCurrentUser(userId) {
    if (userId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId);
    } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
}

export function localSignup(email, password, displayName) {
    const existingUser = findUserByEmail(email);
    if (existingUser) {
        throw new Error('Email already in use');
    }

    // First registered user becomes admin
    const users = getUsers();
    const isFirstUser = users.length === 0;

    const user = createUser({
        email,
        password, // In production, never store plain passwords!
        displayName,
        role: isFirstUser ? 'admin' : 'student',
        mentorId: null
    });

    setCurrentUser(user.id);
    return user;
}

export function localLogin(email, password) {
    const user = findUserByEmail(email);
    if (!user || user.password !== password) {
        throw new Error('Invalid email or password');
    }
    setCurrentUser(user.id);
    return user;
}

export function localLogout() {
    setCurrentUser(null);
}

// Activity methods
export function getActivities() {
    initStorage();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '[]');
}

// Migrate old prayer records (one per prayer) to new format (array per day)
// This runs automatically and is idempotent
let prayerMigrationDone = false;
function migratePrayerRecords() {
    if (prayerMigrationDone) return;
    prayerMigrationDone = true;

    const activities = getActivities();
    const hasSinglePrayers = activities.some(a => a.type === 'prayer' && typeof a.value === 'string');
    if (!hasSinglePrayers) return;

    const prayerActivities = activities.filter(a => a.type === 'prayer');
    const nonPrayerActivities = activities.filter(a => a.type !== 'prayer');

    // Group by userId + date
    const grouped = {};
    for (const activity of prayerActivities) {
        const key = `${activity.userId}__${activity.date}`;
        if (!grouped[key]) {
            grouped[key] = {
                id: activity.id,
                userId: activity.userId,
                type: 'prayer',
                date: activity.date,
                value: [],
                createdAt: activity.createdAt
            };
        }
        const prayers = Array.isArray(activity.value) ? activity.value : [activity.value];
        for (const p of prayers) {
            if (!grouped[key].value.includes(p)) {
                grouped[key].value.push(p);
            }
        }
    }

    const newActivities = [...nonPrayerActivities, ...Object.values(grouped)];
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(newActivities));
    console.log(`Prayer migration: ${prayerActivities.length} records → ${Object.keys(grouped).length} consolidated`);
}

export function getActivitiesByUserId(userId) {
    migratePrayerRecords();
    const activities = getActivities();
    return activities
        .filter(a => a.userId === userId)
        .map(a => ({
            ...a,
            date: parseLocalDate(a.date)
        }))
        .sort((a, b) => b.date - a.date);
}

export function createActivity(userId, type, value, date = new Date()) {
    const activities = getActivities();
    const newActivity = {
        id: generateId(),
        userId,
        type,
        value,
        date: toLocalDateString(date),
        createdAt: new Date().toISOString()
    };
    activities.push(newActivity);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    return newActivity.id;
}

export function updateLocalActivity(activityId, updates) {
    const activities = getActivities();
    const index = activities.findIndex(a => a.id === activityId);
    if (index !== -1) {
        activities[index] = { ...activities[index], ...updates };
        localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
        return true;
    }
    return false;
}

export function deleteLocalActivity(activityId) {
    const activities = getActivities();
    const filtered = activities.filter(a => a.id !== activityId);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(filtered));
    return true;
}

// Find activity by type and date string
export function getActivityByTypeAndDate(userId, type, dateStr) {
    const activities = getActivities();
    return activities.find(a => a.userId === userId && a.type === type && a.date === dateStr) || null;
}

// Create or update activity by type and date (upsert)
export function upsertActivity(userId, type, value, dateStr) {
    const activities = getActivities();
    const index = activities.findIndex(a => a.userId === userId && a.type === type && a.date === dateStr);

    if (index !== -1) {
        // Update existing
        activities[index].value = value;
        localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
        return activities[index].id;
    } else {
        // Create new
        const newActivity = {
            id: generateId(),
            userId,
            type,
            value,
            date: dateStr,
            createdAt: new Date().toISOString()
        };
        activities.push(newActivity);
        localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
        return newActivity.id;
    }
}

// Admin methods
export function getStudentsByMentor(mentorId) {
    const users = getUsers();
    return users.filter(u => u.role === 'student' && u.mentorId === mentorId);
}

export function getAllStudents() {
    const users = getUsers();
    return users.filter(u => u.role === 'student');
}

export function getAllMentors() {
    const users = getUsers();
    return users.filter(u => u.role === 'mentor');
}

export function updateUserRole(userId, newRole) {
    return updateUser(userId, { role: newRole });
}

export function assignMentor(studentId, mentorId) {
    return updateUser(studentId, { mentorId });
}

// Check if using local mode
export function isLocalMode() {
    return true; // Always local for this service
}

// Clear all local data (for testing)
export function clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    initStorage();
}
