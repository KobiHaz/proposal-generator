#!/usr/bin/env node
/**
 * Create a Firebase Auth user (email/password)
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json node scripts/create-user.js <email> <password>
 *
 * Get the service account key:
 *   Firebase Console → Project Settings → Service Accounts → Generate new private key
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: node scripts/create-user.js <email> <password>');
  console.error('');
  console.error('Requires: GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json');
  console.error('Get key: Firebase Console → Project Settings → Service Accounts → Generate new private key');
  process.exit(1);
}

if (!credsPath) {
  console.error('Error: GOOGLE_APPLICATION_CREDENTIALS not set');
  console.error('Set it to the path of your Firebase service account JSON key.');
  process.exit(1);
}

const creds = JSON.parse(readFileSync(resolve(credsPath), 'utf8'));

initializeApp({ credential: cert(creds) });

getAuth()
  .createUser({ email, password })
  .then((user) => {
    console.log('User created:', user.uid, email);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
