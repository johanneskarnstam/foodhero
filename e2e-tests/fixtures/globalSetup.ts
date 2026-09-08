import { FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import { seedFirebaseEmulator } from './seedEmulator';

const execAsync = promisify(exec);

async function globalSetup(config: FullConfig) {
  console.log('🚀 Global setup: Starting Firebase Emulator...');
  
  try {
    // Check if Firebase Emulator is already running
    const { stdout } = await execAsync('lsof -i :9099');
    if (stdout.includes('node')) {
      console.log('✅ Firebase Emulator is already running');
    } else {
      // Start Firebase Emulator
      console.log('🔥 Starting Firebase Emulator...');
      await execAsync('firebase emulators:start --only auth,firestore &', {
        cwd: process.cwd()
      });
      
      // Wait for emulator to start
      console.log('⏳ Waiting for Firebase Emulator to start...');
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      console.log('✅ Firebase Emulator started successfully');
    }
    
    // Seed the emulator with test data
    console.log('🌱 Seeding Firebase Emulator with test data...');
    await seedFirebaseEmulator();
    
    console.log('🎉 Global setup completed successfully!');
  } catch (error) {
    console.error('❌ Error in global setup:', error);
    // Don't fail the tests if emulator setup fails
    console.log('⚠️  Continuing without Firebase Emulator...');
  }
}

export default globalSetup;
