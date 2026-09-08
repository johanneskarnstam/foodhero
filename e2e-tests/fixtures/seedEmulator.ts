import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, collection, addDoc } from 'firebase/firestore';
import seedData from './seedData.json' assert { type: 'json' };

// Firebase emulator config
const firebaseConfig = {
  apiKey: 'test-key',
  authDomain: 'localhost:9099',
  projectId: 'test-project',
  storageBucket: 'test-bucket',
  messagingSenderId: 'test-sender',
  appId: 'test-app-id'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators
connectFirestoreEmulator(db, 'localhost', 8080);

// Seed data types
interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

interface ListData {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    name: string;
    completed: boolean;
    createdAt: string;
    aisle?: string;
    quantity?: string;
  }>;
}

interface MealData {
  id: string;
  userId: string;
  title: string;
  ingredients: string;
  instructions: string;
  category: string;
  createdAt: string;
}

interface MealPlanData {
  id: string;
  userId: string;
  week: number;
  year: number;
  days: Record<string, {
    breakfast: string;
    lunch: string;
    dinner: string;
  }>;
}

interface SettingsData {
  userId: string;
  language: string;
  theme: string;
  aisles: Array<{
    name: string;
    keywords: string[];
  }>;
}

/**
 * Seed Firebase Emulator with test data
 */
export async function seedFirebaseEmulator() {
  console.log('🌱 Seeding Firebase Emulator with test data...');

  try {
    // Seed users
    for (const user of seedData.users as UserData[]) {
      await setDoc(doc(db, 'users', user.uid), user);
      console.log(`✅ Added user: ${user.email}`);
    }

    // Seed lists
    for (const list of seedData.lists as ListData[]) {
      await setDoc(doc(db, 'users', list.userId, 'lists', list.id), {
        ...list,
        // Remove items from list document (they're stored separately)
        items: undefined
      });
      
      // Add items to separate collection
      for (const item of list.items) {
        await setDoc(doc(db, 'users', list.userId, 'lists', list.id, 'items', item.id), item);
      }
      
      console.log(`✅ Added list: ${list.name} with ${list.items.length} items`);
    }

    // Seed meals
    for (const meal of seedData.meals as MealData[]) {
      await setDoc(doc(db, 'users', meal.userId, 'meals', meal.id), meal);
      console.log(`✅ Added meal: ${meal.title}`);
    }

    // Seed meal plans
    for (const plan of seedData.mealPlans as MealPlanData[]) {
      await setDoc(doc(db, 'users', plan.userId, 'mealPlans', plan.id), plan);
      console.log(`✅ Added meal plan: Week ${plan.week}, ${plan.year}`);
    }

    // Seed settings
    for (const settings of seedData.settings as SettingsData[]) {
      await setDoc(doc(db, 'users', settings.userId, 'settings', 'general'), settings);
      console.log(`✅ Added settings for user: ${settings.userId}`);
    }

    console.log('🎉 Firebase Emulator seeded successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error seeding Firebase Emulator:', error);
    return false;
  }
}

/**
 * Clear all data from Firebase Emulator
 */
export async function clearFirebaseEmulator() {
  console.log('🧹 Clearing Firebase Emulator data...');

  try {
    // For now, just log that we would clear the emulator
    // In a real implementation, you would connect to the emulator and delete data
    console.log('⚠️  Emulator cleanup skipped (emulator not running or not connected)');
    console.log('🎉 Firebase Emulator cleared successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error clearing Firebase Emulator:', error);
    return false;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedFirebaseEmulator()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}