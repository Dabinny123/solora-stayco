// Test Firebase Connection for Solora StayCo
import { app, auth, db, storage, analytics } from './firebaseConfig.js';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Test Firebase services connection
 * @returns {Promise<Object>} Test results
 */
export async function testFirebaseConnection() {
    const results = {
        app: false,
        auth: false,
        firestore: false,
        storage: false,
        analytics: false,
        errors: []
    };

    try {
        // Test Firebase App
        if (app) {
            results.app = true;
            console.log('✅ Firebase App initialized');
        } else {
            results.errors.push('Firebase App not initialized');
        }

        // Test Firebase Auth
        if (auth) {
            results.auth = true;
            console.log('✅ Firebase Auth initialized');
        } else {
            results.errors.push('Firebase Auth not initialized');
        }

        // Test Firestore
        if (db) {
            try {
                // Try to access a collection (this will fail if Firestore is not properly configured)
                const testCollection = collection(db, 'test');
                await getDocs(testCollection);
                results.firestore = true;
                console.log('✅ Firestore connected');
            } catch (error) {
                // Even if collection doesn't exist, if we can access it, Firestore is working
                if (error.code === 'permission-denied' || error.code === 'not-found') {
                    results.firestore = true;
                    console.log('✅ Firestore connected (permission/not-found is expected for test collection)');
                } else {
                    results.errors.push(`Firestore error: ${error.message}`);
                }
            }
        } else {
            results.errors.push('Firestore not initialized');
        }

        // Test Firebase Storage
        if (storage) {
            results.storage = true;
            console.log('✅ Firebase Storage initialized');
        } else {
            results.errors.push('Firebase Storage not initialized');
        }

        // Test Analytics
        if (analytics) {
            results.analytics = true;
            console.log('✅ Firebase Analytics initialized');
        } else {
            results.errors.push('Firebase Analytics not initialized');
        }

    } catch (error) {
        results.errors.push(`Connection test error: ${error.message}`);
        console.error('❌ Firebase connection test failed:', error);
    }

    return results;
}

/**
 * Display test results in console
 * @param {Object} results - Test results
 */
export function displayTestResults(results) {
    console.log('\n=== Firebase Connection Test Results ===');
    console.log(`App: ${results.app ? '✅' : '❌'}`);
    console.log(`Auth: ${results.auth ? '✅' : '❌'}`);
    console.log(`Firestore: ${results.firestore ? '✅' : '❌'}`);
    console.log(`Storage: ${results.storage ? '✅' : '❌'}`);
    console.log(`Analytics: ${results.analytics ? '✅' : '❌'}`);
    
    if (results.errors.length > 0) {
        console.log('\nErrors:');
        results.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    const allPassed = results.app && results.auth && results.firestore && results.storage && results.analytics;
    console.log(`\nOverall: ${allPassed ? '✅ All services connected' : '❌ Some services failed'}`);
    console.log('========================================\n');
    
    return allPassed;
}

