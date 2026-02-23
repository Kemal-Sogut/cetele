import { createContext, useContext, useState, useEffect } from 'react';
import * as localStore from '../services/localStorage';
import { setAdminLogging } from '../services/activityService';

// Check if we should use local mode
const USE_LOCAL_MODE = import.meta.env.VITE_USE_LOCAL === 'true' ||
    window.location.hostname === 'localhost';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Firebase imports (lazy loaded)
    let auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, doc, getDoc, setDoc, serverTimestamp, sendPasswordResetEmail;

    async function loadFirebase() {
        if (USE_LOCAL_MODE) return false;
        try {
            const firebaseAuth = await import('firebase/auth');
            const firebaseFirestore = await import('firebase/firestore');
            const firebase = await import('../services/firebase');

            auth = firebase.auth;
            db = firebase.db;
            createUserWithEmailAndPassword = firebaseAuth.createUserWithEmailAndPassword;
            signInWithEmailAndPassword = firebaseAuth.signInWithEmailAndPassword;
            signOut = firebaseAuth.signOut;
            onAuthStateChanged = firebaseAuth.onAuthStateChanged;
            sendPasswordResetEmail = firebaseAuth.sendPasswordResetEmail;
            doc = firebaseFirestore.doc;
            getDoc = firebaseFirestore.getDoc;
            setDoc = firebaseFirestore.setDoc;
            serverTimestamp = firebaseFirestore.serverTimestamp;
            return true;
        } catch (e) {
            console.warn('Firebase not available, using local storage');
            return false;
        }
    }

    async function signup(email, password, displayName) {
        if (USE_LOCAL_MODE) {
            const user = localStore.localSignup(email, password, displayName);
            setCurrentUser({ uid: user.id, email: user.email });
            setUserProfile(user);
            return { user: { uid: user.id } };
        }

        await loadFirebase();
        const result = await createUserWithEmailAndPassword(auth, email, password);

        await setDoc(doc(db, 'users', result.user.uid), {
            email,
            displayName,
            role: 'student',
            mentorId: null,
            createdAt: serverTimestamp()
        });

        return result;
    }

    async function login(email, password) {
        if (USE_LOCAL_MODE) {
            const user = localStore.localLogin(email, password);
            setCurrentUser({ uid: user.id, email: user.email });
            setUserProfile(user);
            return { user: { uid: user.id } };
        }

        await loadFirebase();
        return signInWithEmailAndPassword(auth, email, password);
    }

    async function logout() {
        if (USE_LOCAL_MODE) {
            localStore.localLogout();
            setCurrentUser(null);
            setUserProfile(null);
            return;
        }

        await loadFirebase();
        return signOut(auth);
    }

    async function resetPassword(email) {
        if (USE_LOCAL_MODE) {
            // In local mode, check if user exists
            const users = localStore.getAllUsers ? localStore.getAllUsers() : [];
            const userExists = users.some(u => u.email === email);
            if (!userExists) {
                throw new Error('No account found with this email address.');
            }
            // Simulate email sent
            console.log(`[Local Mode] Password reset email would be sent to: ${email}`);
            return;
        }

        await loadFirebase();
        return sendPasswordResetEmail(auth, email);
    }

    async function subscribeToUserProfile(uid) {
        if (USE_LOCAL_MODE) {
            // No real-time subscription for local users, just fetch
            const profile = localStore.getUserById(uid);
            setUserProfile(profile);
            if (profile?.role === 'admin') setAdminLogging(true);
            return () => { };
        }

        try {
            await loadFirebase();
            const docRef = doc(db, 'users', uid);

            // Re-importing inside cause of lazy loading
            const firestore = await import('firebase/firestore');
            const onSnapshot = firestore.onSnapshot;

            const unsubscribe = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setUserProfile({ id: uid, ...data });
                    if (data.role === 'admin') {
                        setAdminLogging(true);
                    }
                } else {
                    setUserProfile(null);
                }
            });
            return unsubscribe;
        } catch (error) {
            console.error('Error subscribing to user profile:', error);
            setUserProfile(null);
            return () => { };
        }
    }

    useEffect(() => {
        async function init() {
            if (USE_LOCAL_MODE) {
                const user = localStore.getCurrentUser();
                if (user) {
                    setCurrentUser({ uid: user.id, email: user.email });
                    subscribeToUserProfile(user.id);
                }
                setLoading(false);
                return;
            }

            const firebaseLoaded = await loadFirebase();
            if (!firebaseLoaded) {
                setLoading(false);
                return;
            }

            let profileUnsubscribe;

            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                setCurrentUser(user);
                if (user) {
                    if (profileUnsubscribe) profileUnsubscribe();
                    profileUnsubscribe = await subscribeToUserProfile(user.uid);
                } else {
                    setUserProfile(null);
                }
                setLoading(false);
            });

            return () => {
                unsubscribe();
                if (profileUnsubscribe) profileUnsubscribe();
            };
        }

        init();
    }, []);

    const value = {
        currentUser,
        userProfile,
        signup,
        login,
        logout,
        resetPassword,
        loading,
        isStudent: userProfile?.role === 'student',
        isMentor: userProfile?.role === 'mentor',
        isAdmin: userProfile?.role === 'admin',
        isLocalMode: USE_LOCAL_MODE,
        refreshProfile: async () => {
            // Safe one-shot fetch — does NOT create a new onSnapshot
            if (USE_LOCAL_MODE) {
                const profile = localStore.getUserById(currentUser?.uid);
                setUserProfile(profile);
                return;
            }
            if (!currentUser) return;
            await loadFirebase();
            const docRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setUserProfile({ id: currentUser.uid, ...docSnap.data() });
            }
        }
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
