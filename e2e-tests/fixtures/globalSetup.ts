import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Global setup: Using Mock Auth for testing');
  
  // No need to start Firebase Emulator - we're using mock auth
  console.log('✅ Mock Auth is ready!');
  console.log('🎉 Global setup completed successfully!');
}

export default globalSetup;
