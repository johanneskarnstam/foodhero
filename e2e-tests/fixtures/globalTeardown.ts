import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Global teardown: Cleaning up...');
  
  // No need to clean up Firebase Emulator - we're using mock auth
  console.log('✅ Global teardown completed successfully!');
}

export default globalTeardown;
