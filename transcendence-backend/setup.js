#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

console.log('🚀 Setting up Transcendence Backend...\n');

// Create necessary directories
const directories = [
  'shared/data',
  'user-service/uploads',
  'api-gateway/public'
];

directories.forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Install dependencies
console.log('\n📦 Installing dependencies...');

try {
  // Install root dependencies
  console.log('Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Install all service dependencies
  console.log('Installing service dependencies...');
  execSync('npm run install:services', { stdio: 'inherit' });

  console.log('\n✅ Setup completed successfully!');
  console.log('\n🎯 Next steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Backend will be available at: http://localhost:3000');
  console.log('3. Individual services:');
  console.log('   - API Gateway: http://localhost:3000');
  console.log('   - Auth Service: http://localhost:3001');
  console.log('   - User Service: http://localhost:3002');
  console.log('   - Friendship Service: http://localhost:3003');
  console.log('   - Game Service: http://localhost:3004');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
} 