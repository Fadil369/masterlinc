#!/usr/bin/env node
/**
 * 3CX Authentication Debug Tool
 * Tests various authentication methods against 3CX Cloud PBX
 */

import https from 'https';
import { URLSearchParams } from 'url';

const FQDN = '1593.3cx.cloud';
const USERNAME = 'dr.mf.12298@gmail.com';
const PASSWORD = 'HFLC1rjZlPHNz6v7';
const EXTENSION = '12310';

interface AuthTest {
  name: string;
  execute: () => Promise<{ success: boolean; data?: any; error?: string }>;
}

// Test 1: OAuth2 Password Grant (Standard)
async function testOAuth2Password(): Promise<any> {
  const body = new URLSearchParams({
    grant_type: 'password',
    username: USERNAME,
    password: PASSWORD,
    client_id: '3CXPhoneSystem',
  });

  const res = await fetch(`https://${FQDN}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  return {
    status: res.status,
    statusText: res.statusText,
    headers: Object.fromEntries(res.headers.entries()),
    body: res.ok ? await res.json() : await res.text(),
  };
}

// Test 2: Basic Auth to Management API
async function testBasicAuth(): Promise<any> {
  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  
  const res = await fetch(`https://${FQDN}/api/SystemStatus`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  return {
    status: res.status,
    statusText: res.statusText,
    body: res.ok ? await res.json() : await res.text(),
  };
}

// Test 3: Extension-based auth
async function testExtensionAuth(): Promise<any> {
  const body = new URLSearchParams({
    grant_type: 'password',
    username: EXTENSION,
    password: PASSWORD,
    client_id: '3CXPhoneSystem',
  });

  const res = await fetch(`https://${FQDN}/connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  return {
    status: res.status,
    statusText: res.statusText,
    body: res.ok ? await res.json() : await res.text(),
  };
}

// Test 4: Check OpenID configuration
async function testOpenIDConfig(): Promise<any> {
  const res = await fetch(`https://${FQDN}/.well-known/openid-configuration`);
  return {
    status: res.status,
    body: res.ok ? await res.json() : await res.text(),
  };
}

// Test 5: Direct API login endpoint
async function testAPILogin(): Promise<any> {
  const res = await fetch(`https://${FQDN}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Username: USERNAME,
      Password: PASSWORD,
    }),
  });

  return {
    status: res.status,
    body: res.ok ? await res.json() : await res.text(),
  };
}

// Test 6: Check if server is accessible
async function testServerReachability(): Promise<any> {
  const res = await fetch(`https://${FQDN}`);
  return {
    status: res.status,
    statusText: res.statusText,
    headers: Object.fromEntries(res.headers.entries()),
  };
}

const tests: AuthTest[] = [
  {
    name: 'Server Reachability',
    execute: async () => {
      try {
        const result = await testServerReachability();
        return { success: result.status === 200 || result.status === 302, data: result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
  {
    name: 'OpenID Configuration Discovery',
    execute: async () => {
      try {
        const result = await testOpenIDConfig();
        return { success: result.status === 200, data: result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
  {
    name: 'OAuth2 Password Grant (Email)',
    execute: async () => {
      try {
        const result = await testOAuth2Password();
        return { success: result.status === 200, data: result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
  {
    name: 'OAuth2 Password Grant (Extension)',
    execute: async () => {
      try {
        const result = await testExtensionAuth();
        return { success: result.status === 200, data: result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
  {
    name: 'Basic Authentication',
    execute: async () => {
      try {
        const result = await testBasicAuth();
        return { success: result.status === 200, data: result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
  {
    name: 'Direct API Login',
    execute: async () => {
      try {
        const result = await testAPILogin();
        return { success: result.status === 200, data: result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
  },
];

async function runTests() {
  console.log('\n🔐 3CX Authentication Debug Tool\n');
  console.log(`FQDN: ${FQDN}`);
  console.log(`Username: ${USERNAME}`);
  console.log(`Extension: ${EXTENSION}`);
  console.log('\n' + '='.repeat(80) + '\n');

  for (const test of tests) {
    console.log(`\n📋 Test: ${test.name}`);
    console.log('-'.repeat(80));

    try {
      const result = await test.execute();

      if (result.success) {
        console.log('✅ SUCCESS');
        if (result.data) {
          console.log(JSON.stringify(result.data, null, 2));
        }
      } else {
        console.log('❌ FAILED');
        if (result.error) {
          console.log(`Error: ${result.error}`);
        }
        if (result.data) {
          console.log(JSON.stringify(result.data, null, 2));
        }
      }
    } catch (error: any) {
      console.log('❌ EXCEPTION');
      console.log(`Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Debug tests complete\n');
}

if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests };
