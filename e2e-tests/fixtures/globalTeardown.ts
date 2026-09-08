import { FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import { clearFirebaseEmulator } from './seedEmulator';

const execAsync = promisify(exec);

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Global teardown: Cleaning up...');
  
  try {
    // Clear Firebase Emulator data
    console.log('🗑️  Clearing Firebase Emulator data...');
    await clearFirebaseEmulator();
    
    // Stop Firebase Emulator (optional - usually you want to keep it running for multiple test sessions)
    // console.log('🛑 Stopping Firebase Emulator...');
    // await execAsync('pkill -f "firebase emulators:start"');
    
    console.log('✅ Global teardown completed successfully!');
  } catch (error) {
    console.error('❌ Error in global teardown:', error);
  }
}

export default globalTeardown;
