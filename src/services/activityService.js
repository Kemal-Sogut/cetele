// Activity service for CRUD operations and data fetching
// Supports both Firebase and Local Storage modes

import * as localStore from './localStorage';
import { toLocalDateString } from '../utils/calculations';

// Check if we should use local mode (Firebase not configured or development)
const USE_LOCAL_MODE = import.meta.env.VITE_USE_LOCAL === 'true' ||
    window.location.hostname === 'localhost';

// Activity types
export const ACTIVITY_TYPES = {
    FASTING: 'fasting',
    PRAYER: 'prayer',
    TARAWEH: 'taraweh',
    RISALE: 'risale',
    PIRLANTA: 'pirlanta',
    QURAN: 'quran',
    QURAN_MEAL: 'quran_meal',
    NAFILE: 'nafile'
};

// Prayer names
export const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// Points configuration
export const POINTS_CONFIG = {
    fasting: 3,        // 3 points per day
    taraweh: 3,        // 3 points per day (≥10 rakats)
    prayer: 0,         // No points (minimum requirement)
    quran: 3,          // 3 points per page
    nafile: 0,         // No points (minimum requirement)
    risale: 2,         // 2 points per page
    pirlanta: 2,       // 2 points per page
    quran_meal: 2      // 2 points per page
};

/**
 * Calculate total points from all activities
 */
export function calculateTotalPoints(activities) {
    let points = 0;

    activities.forEach(activity => {
        const pointValue = POINTS_CONFIG[activity.type] || 0;

        switch (activity.type) {
            case 'fasting':
                if (activity.value === true) {
                    points += pointValue;
                }
                break;
            case 'taraweh':
                if (activity.value >= 10) {
                    points += pointValue;
                }
                break;
            case 'quran':
            case 'risale':
            case 'pirlanta':
            case 'quran_meal':
                points += pointValue * (parseInt(activity.value) || 0);
                break;
            default:
                break;
        }
    });

    return points;
}

/**
 * Calculate points for a SINGLE activity (zero Firestore reads).
 */
export function calculateActivityPoints(type, value) {
    const pointValue = POINTS_CONFIG[type] || 0;
    switch (type) {
        case 'fasting':
            return value === true ? pointValue : 0;
        case 'taraweh':
            return value >= 10 ? pointValue : 0;
        case 'quran':
        case 'risale':
        case 'pirlanta':
        case 'quran_meal':
            return pointValue * (parseInt(value) || 0);
        default:
            return 0;
    }
}

/**
 * Calculate stat updates for a SINGLE activity
 * returns an object of stat increments (or decrements if isDelete is true)
 */
export function calculateActivityStats(type, value, isDelete = false) {
    const multiplier = isDelete ? -1 : 1;
    const updates = {};

    switch (type) {
        case 'fasting':
            if (value === true) updates['stats.totalFasting'] = 1 * multiplier;
            break;
        case 'taraweh':
            if (value >= 10) updates['stats.totalTaraweh'] = 1 * multiplier;
            break;
        case 'quran':
            updates['stats.quranPages'] = (parseInt(value) || 0) * multiplier;
            break;
        case 'risale':
            updates['stats.risalePages'] = (parseInt(value) || 0) * multiplier;
            break;
        case 'pirlanta':
            updates['stats.pirlantaPages'] = (parseInt(value) || 0) * multiplier;
            break;
        case 'quran_meal':
            updates['stats.quranMealPages'] = (parseInt(value) || 0) * multiplier;
            break;
        case 'nafile':
            updates['stats.totalNafile'] = (parseInt(value) || 0) * multiplier;
            break;
        case 'prayer':
            const prayerCount = Array.isArray(value) ? value.length : (value ? 1 : 0);
            updates['stats.totalPrayers'] = prayerCount * multiplier;
            break;
    }
    return updates;
}

/**
 * Update user points and stats
 */
async function updateUserStatsAndPoints(userId, type, value, isDelete = false) {
    const pointDelta = calculateActivityPoints(type, value) * (isDelete ? -1 : 1);
    const statUpdates = calculateActivityStats(type, value, isDelete);

    await updateStatsAndPointsDelta(userId, pointDelta, statUpdates);
}

/**
 * Apply precise deltas for points and stats
 */
async function updateStatsAndPointsDelta(userId, pointDelta, statUpdates) {
    if (pointDelta === 0 && Object.keys(statUpdates).length === 0) return;

    if (USE_LOCAL_MODE) {
        const user = localStore.getUserById(userId);
        const currentPoints = user?.points || 0;
        const currentStats = user?.stats || {};

        const newStats = { ...currentStats };
        for (const [key, val] of Object.entries(statUpdates)) {
            if (val === 0) continue;
            const statKey = key.split('.')[1];
            newStats[statKey] = (newStats[statKey] || 0) + val;
        }

        localStore.updateUser(userId, {
            points: currentPoints + pointDelta,
            stats: newStats
        });
        return;
    }

    await loadFirebase();
    const { increment } = await import('firebase/firestore');

    const firestoreUpdates = {};
    if (pointDelta !== 0) {
        firestoreUpdates.points = increment(pointDelta);
    }

    for (const [key, val] of Object.entries(statUpdates)) {
        if (val !== 0) {
            firestoreUpdates[key] = increment(val);
        }
    }

    if (Object.keys(firestoreUpdates).length > 0) {
        logApiCall('updateDoc-adjustStatsAndPoints', { userId, firestoreUpdates });
        await updateDoc(doc(db, 'users', userId), firestoreUpdates);
    }
}

// Firebase imports (lazy loaded)
let firebaseLoaded = false;
let db, collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp, getDoc, onSnapshot;

// ─── Admin API Logging ──────────────────────────────────────
let adminLoggingEnabled = false;

export function setAdminLogging(enabled) {
    adminLoggingEnabled = enabled;
}

function logApiCall(name, params) {
    if (adminLoggingEnabled) {
        console.log(`[Firestore API] ${name}`, params);
    }
}

async function loadFirebase() {
    if (firebaseLoaded) return;
    try {
        const firestore = await import('firebase/firestore');
        const firebase = await import('./firebase');
        db = firebase.db;
        collection = firestore.collection;
        query = firestore.query;
        where = firestore.where;
        orderBy = firestore.orderBy;
        getDocs = firestore.getDocs;
        addDoc = firestore.addDoc;
        updateDoc = firestore.updateDoc;
        deleteDoc = firestore.deleteDoc;
        doc = firestore.doc;
        serverTimestamp = firestore.serverTimestamp;
        Timestamp = firestore.Timestamp;
        getDoc = firestore.getDoc;
        onSnapshot = firestore.onSnapshot;
        // increment is imported on demand in adjustUserPoints
        firebaseLoaded = true;
    } catch (e) {
        console.warn('Firebase not available, using local storage');
    }
}

// ─── In-memory cache ────────────────────────────────────────
// Keyed by userId → { data, timestamp }
const activityCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(userId) {
    const entry = activityCache[userId];
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
        return entry.data;
    }
    return null;
}

function setCache(userId, data) {
    activityCache[userId] = { data, timestamp: Date.now() };
}

export function invalidateCache(userId) {
    delete activityCache[userId];
}

// ─── Real-time subscription (onSnapshot) ────────────────────
// Returns an unsubscribe function. Use in Dashboard useEffect.
export async function subscribeToUserActivities(userId, callback) {
    if (USE_LOCAL_MODE) {
        // Local mode: just call back with current data
        const data = localStore.getActivitiesByUserId(userId);
        callback(data);
        // Return a no-op unsubscribe
        return () => { };
    }

    await loadFirebase();


    const q = query(
        collection(db, 'activities'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
    );

    logApiCall('subscribeToUserActivities', { userId });
    const unsubscribe = onSnapshot(q, (snapshot) => {
        logApiCall('onSnapshot-update', { userId, count: snapshot.size });
        const data = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            date: d.data().date?.toDate()
        }));
        setCache(userId, data); // Keep cache warm
        callback(data);
    }, (error) => {
        console.error('Snapshot listener error:', error);
    });

    return unsubscribe;
}

/**
 * Real-time subscription to RECENT activities (limited to 20)
 * Suitable for Dashboard feeds without fetching complete history
 */
export async function subscribeToRecentActivities(userId, limitCount = 20, callback) {
    if (USE_LOCAL_MODE) {
        const data = localStore.getActivitiesByUserId(userId).slice(0, limitCount);
        callback(data);
        return () => { };
    }

    await loadFirebase();
    const { limit } = await import('firebase/firestore');

    const q = query(
        collection(db, 'activities'),
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(limitCount)
    );

    logApiCall('subscribeToRecentActivities', { userId, limitCount });
    const unsubscribe = onSnapshot(q, (snapshot) => {
        logApiCall('onSnapshot-recentActivities', { userId, count: snapshot.size });
        const data = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            date: d.data().date?.toDate()
        }));
        setCache(userId, data);
        callback(data);
    }, (error) => {
        console.error('Snapshot listener error:', error);
    });

    return unsubscribe;
}

// Get all activities for a user
// Uses cache when available (populated by subscribeToUserActivities or previous calls)
export async function getUserActivities(userId, options = {}) {
    if (USE_LOCAL_MODE) {
        return localStore.getActivitiesByUserId(userId);
    }

    const { type, startDate, endDate } = options;
    const hasFilters = type || startDate || endDate;

    // Use cache for unfiltered requests (most common — Dashboard, ActivityLog)
    if (!hasFilters) {
        const cached = getCached(userId);
        if (cached) {
            return cached; // 0 Firestore reads!
        }
    }

    await loadFirebase();

    let constraints = [where('userId', '==', userId)];

    if (type) {
        constraints.push(where('type', '==', type));
    }

    if (startDate) {
        constraints.push(where('date', '>=', Timestamp.fromDate(startDate)));
    }

    if (endDate) {
        constraints.push(where('date', '<=', Timestamp.fromDate(endDate)));
    }

    constraints.push(orderBy('date', 'desc'));

    const q = query(collection(db, 'activities'), ...constraints);
    logApiCall('getUserActivities', { userId, options });
    const snapshot = await getDocs(q);

    const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
    }));

    // Cache unfiltered results
    if (!hasFilters) {
        setCache(userId, data);
    }

    return data;
}

// Get paginated activities for a user
export async function getPaginatedActivities(userId, options = {}) {
    if (USE_LOCAL_MODE) {
        let all = localStore.getActivitiesByUserId(userId);
        if (options.type && options.type !== 'all') {
            all = all.filter(a => a.type === options.type);
        }
        const startIndex = options.offset || 0;
        const limitCount = options.limit || 20;
        const data = all.slice(startIndex, startIndex + limitCount);
        return {
            data,
            lastVisible: startIndex + data.length, // use numeric offset for local
            hasMore: startIndex + data.length < all.length
        };
    }

    await loadFirebase();
    const { startAfter, limit } = await import('firebase/firestore');

    let constraints = [where('userId', '==', userId)];

    if (options.type && options.type !== 'all') {
        constraints.push(where('type', '==', options.type));
    }

    constraints.push(orderBy('date', 'desc'));

    if (options.lastVisible) {
        constraints.push(startAfter(options.lastVisible));
    }

    const limitCount = options.limit || 20;
    constraints.push(limit(limitCount));

    const q = query(collection(db, 'activities'), ...constraints);
    logApiCall('getPaginatedActivities', { userId, options });
    const snapshot = await getDocs(q);

    const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
    }));

    return {
        data,
        lastVisible: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === limitCount
    };
}

// Add a new activity
export async function createActivity(userId, type, value, date = new Date()) {

    if (type === 'taraweh') {
        const dateStr = toLocalDateString(date);
        const allActivities = await getUserActivities(userId);
        const hasTaraweh = allActivities.some(a =>
            a.type === 'taraweh' && toLocalDateString(a.date) === dateStr
        );

        if (hasTaraweh) {
            alert('You have already added a taraweh activity for this date');
            return;
        }
    }

    if (USE_LOCAL_MODE) {
        const id = localStore.createActivity(userId, type, value, date);
        invalidateCache(userId);
        await updateUserStatsAndPoints(userId, type, value, false);
        return id;
    }

    await loadFirebase();
    logApiCall('addDoc-activities', { userId, type, value, date });
    const docRef = await addDoc(collection(db, 'activities'), {
        userId,
        type,
        value,
        date: Timestamp.fromDate(date),
        createdAt: serverTimestamp()
    });

    // Increment points and stats atomically
    await updateUserStatsAndPoints(userId, type, value, false);
    return docRef.id;
}

// Upsert prayer activity — one record per day with array of prayer names
export async function upsertPrayerActivity(userId, date, prayers) {
    const dateStr = toLocalDateString(date);

    if (USE_LOCAL_MODE) {
        // Calculate diff for local mode points/stats
        const existingRecord = localStore.getActivityByTypeAndDate(userId, 'prayer', dateStr);
        const oldPrayers = existingRecord ? existingRecord.value : [];
        const oldPoints = calculateActivityPoints('prayer', oldPrayers);
        const newPoints = calculateActivityPoints('prayer', prayers);
        const oldStatCount = Array.isArray(oldPrayers) ? oldPrayers.length : (oldPrayers ? 1 : 0);
        const newStatCount = Array.isArray(prayers) ? prayers.length : (prayers ? 1 : 0);

        const result = localStore.upsertActivity(userId, 'prayer', prayers, dateStr);
        invalidateCache(userId);

        await updateStatsAndPointsDelta(userId, newPoints - oldPoints, {
            'stats.totalPrayers': newStatCount - oldStatCount
        });

        return result;
    }

    await loadFirebase();

    // Query for existing prayer record on this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
        collection(db, 'activities'),
        where('userId', '==', userId),
        where('type', '==', 'prayer'),
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<=', Timestamp.fromDate(endOfDay))
    );
    logApiCall('getDocs-upsertPrayer', { userId, dateStr });
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        const existingDoc = snapshot.docs[0];
        const oldPrayers = existingDoc.data().value;
        const oldPoints = calculateActivityPoints('prayer', oldPrayers);
        const newPoints = calculateActivityPoints('prayer', prayers);
        const oldStatCount = Array.isArray(oldPrayers) ? oldPrayers.length : (oldPrayers ? 1 : 0);
        const newStatCount = Array.isArray(prayers) ? prayers.length : (prayers ? 1 : 0);

        logApiCall('updateDoc-prayer', { id: existingDoc.id, prayers });
        await updateDoc(doc(db, 'activities', existingDoc.id), {
            value: prayers,
            updatedAt: serverTimestamp()
        });

        await updateStatsAndPointsDelta(userId, newPoints - oldPoints, {
            'stats.totalPrayers': newStatCount - oldStatCount
        });

        return existingDoc.id;
    } else {
        // Create new record
        logApiCall('addDoc-prayer', { userId, prayers, date });
        const docRef = await addDoc(collection(db, 'activities'), {
            userId,
            type: 'prayer',
            value: prayers,
            date: Timestamp.fromDate(date),
            createdAt: serverTimestamp()
        });
        await updateUserStatsAndPoints(userId, 'prayer', prayers, false);
        return docRef.id;
    }
}

// Get prayer activity for a specific date
export async function getPrayerActivityForDate(userId, date) {
    const dateStr = toLocalDateString(date);

    if (USE_LOCAL_MODE) {
        const record = localStore.getActivityByTypeAndDate(userId, 'prayer', dateStr);
        return record ? (Array.isArray(record.value) ? record.value : [record.value]) : [];
    }

    await loadFirebase();

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
        collection(db, 'activities'),
        where('userId', '==', userId),
        where('type', '==', 'prayer'),
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<=', Timestamp.fromDate(endOfDay))
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        const val = snapshot.docs[0].data().value;
        return Array.isArray(val) ? val : [val];
    }
    return [];
}

// Update an activity
export async function updateActivity(activityId, userId, updates, oldType, oldValue) {
    if (USE_LOCAL_MODE) {
        localStore.updateLocalActivity(activityId, updates);

        // Adjust points & stats for updates (subtract old, add new)
        if (updates.value !== undefined && updates.value !== oldValue && userId) {
            await updateUserStatsAndPoints(userId, oldType, oldValue, true); // remove old
            await updateUserStatsAndPoints(userId, updates.type || oldType, updates.value, false); // add new
        }
        return;
    }

    await loadFirebase();
    logApiCall('updateDoc-activity', { activityId, updates });
    const docRef = doc(db, 'activities', activityId);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
    });

    // Adjust points & stats for updates
    if (updates.value !== undefined && updates.value !== oldValue && userId) {
        await updateUserStatsAndPoints(userId, oldType, oldValue, true); // remove old
        await updateUserStatsAndPoints(userId, updates.type || oldType, updates.value, false); // add new
    }
}

// Delete an activity
export async function deleteActivity(activityId, userId) {
    // Fetch the activity BEFORE deleting so we know what stats/points to deduct
    let fetchedActivity = null;
    if (USE_LOCAL_MODE) {
        const activities = localStore.getActivities();
        fetchedActivity = activities.find(a => a.id === activityId);
        localStore.deleteLocalActivity(activityId);
        if (userId && fetchedActivity) {
            invalidateCache(userId);
            await updateUserStatsAndPoints(userId, fetchedActivity.type, fetchedActivity.value, true);
        }
        return;
    }

    // In Firebase mode, get it from cache or fetch
    fetchedActivity = await getActivity(activityId);

    await loadFirebase();
    logApiCall('deleteDoc-activity', { activityId });
    await deleteDoc(doc(db, 'activities', activityId));
    if (userId && fetchedActivity) {
        invalidateCache(userId);
        await updateUserStatsAndPoints(userId, fetchedActivity.type, fetchedActivity.value, true);
    }
}

// Get activity by ID
export async function getActivity(activityId) {
    if (USE_LOCAL_MODE) {
        const activities = localStore.getActivities();
        return activities.find(a => a.id === activityId) || null;
    }

    await loadFirebase();
    const docRef = doc(db, 'activities', activityId);
    logApiCall('getDoc-activity', { activityId });
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return {
            id: docSnap.id,
            ...docSnap.data(),
            date: docSnap.data().date?.toDate()
        };
    }

    return null;
}

// Get students assigned to a mentor
export async function getAssignedStudents(mentorId) {
    if (USE_LOCAL_MODE) {
        return localStore.getStudentsByMentor(mentorId);
    }

    await loadFirebase();
    const q = query(
        collection(db, 'users'),
        where('mentorId', '==', mentorId),
        where('role', '==', 'student')
    );

    logApiCall('getDocs-assignedStudents', { mentorId });
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

// Get all users (admin only)
export async function getAllUsers() {
    if (USE_LOCAL_MODE) {
        return localStore.getUsers();
    }

    await loadFirebase();
    logApiCall('getDocs-allUsers', {});
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

// Update user role (admin only)
export async function updateUserRole(userId, newRole) {
    if (USE_LOCAL_MODE) {
        return localStore.updateUserRole(userId, newRole);
    }

    await loadFirebase();
    logApiCall('updateDoc-userRole', { userId, newRole });
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, { role: newRole });
}

// Assign student to mentor (admin only)
export async function assignStudentToMentor(studentId, mentorId) {
    if (USE_LOCAL_MODE) {
        return localStore.assignMentor(studentId, mentorId);
    }

    await loadFirebase();
    logApiCall('updateDoc-assignMentor', { studentId, mentorId });
    const docRef = doc(db, 'users', studentId);
    await updateDoc(docRef, { mentorId });
}

// Check if using local mode
export function isLocalMode() {
    return USE_LOCAL_MODE;
}

// One-time migration function to calculate and save stats for all users
export async function initializeAllUserStats() {
    if (USE_LOCAL_MODE) return 0;

    await loadFirebase();
    const { writeBatch } = await import('firebase/firestore');

    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    let batch = writeBatch(db);
    let count = 0;

    const { calculateAllStats } = await import('../utils/calculations');

    for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        // Use unfiltered queries to get all activities
        const q = query(collection(db, 'activities'), where('userId', '==', userId));
        const activitiesSnapshot = await getDocs(q);
        const activities = activitiesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate()
        }));

        const stats = calculateAllStats(activities);

        let points = 0;
        activities.forEach(activity => {
            const tempStats = calculateActivityStats(activity.type, activity.value);
            points += tempStats.points;
        });

        batch.update(userDoc.ref, {
            stats: stats,
            points: points
        });

        count++;
        // Firestore batch limits to 500 operations
        if (count % 400 === 0) {
            await batch.commit();
            batch = writeBatch(db);
        }
    }

    if (count % 400 !== 0) {
        await batch.commit();
    }

    return count;
}
