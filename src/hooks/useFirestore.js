import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';

export function useFirestore() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Get activities for a specific user and optional type
    async function getActivities(userId, type = null, startDate = null, endDate = null) {
        setLoading(true);
        setError(null);

        try {
            let q;
            const activitiesRef = collection(db, 'activities');

            if (type && startDate && endDate) {
                q = query(
                    activitiesRef,
                    where('userId', '==', userId),
                    where('type', '==', type),
                    where('date', '>=', Timestamp.fromDate(startDate)),
                    where('date', '<=', Timestamp.fromDate(endDate)),
                    orderBy('date', 'desc')
                );
            } else if (type) {
                q = query(
                    activitiesRef,
                    where('userId', '==', userId),
                    where('type', '==', type),
                    orderBy('date', 'desc')
                );
            } else if (startDate && endDate) {
                q = query(
                    activitiesRef,
                    where('userId', '==', userId),
                    where('date', '>=', Timestamp.fromDate(startDate)),
                    where('date', '<=', Timestamp.fromDate(endDate)),
                    orderBy('date', 'desc')
                );
            } else {
                q = query(
                    activitiesRef,
                    where('userId', '==', userId),
                    orderBy('date', 'desc')
                );
            }

            const snapshot = await getDocs(q);
            const activities = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate()
            }));

            setLoading(false);
            return activities;
        } catch (err) {
            setError(err.message);
            setLoading(false);
            return [];
        }
    }

    // Add a new activity
    async function addActivity(userId, type, value, date = new Date()) {
        setLoading(true);
        setError(null);

        try {
            const docRef = await addDoc(collection(db, 'activities'), {
                userId,
                type,
                value,
                date: Timestamp.fromDate(date),
                createdAt: serverTimestamp()
            });

            setLoading(false);
            return docRef.id;
        } catch (err) {
            setError(err.message);
            setLoading(false);
            return null;
        }
    }

    // Update an existing activity
    async function updateActivity(activityId, updates) {
        setLoading(true);
        setError(null);

        try {
            await updateDoc(doc(db, 'activities', activityId), {
                ...updates,
                updatedAt: serverTimestamp()
            });

            setLoading(false);
            return true;
        } catch (err) {
            setError(err.message);
            setLoading(false);
            return false;
        }
    }

    // Delete an activity
    async function deleteActivity(activityId) {
        setLoading(true);
        setError(null);

        try {
            await deleteDoc(doc(db, 'activities', activityId));
            setLoading(false);
            return true;
        } catch (err) {
            setError(err.message);
            setLoading(false);
            return false;
        }
    }

    return {
        loading,
        error,
        getActivities,
        addActivity,
        updateActivity,
        deleteActivity
    };
}
