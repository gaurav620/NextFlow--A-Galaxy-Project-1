#!/usr/bin/env node
// Script to check and update Vercel environment variables for NextFlow project
// Updated to handle 'sensitive' type env vars

const PROJECT_ID = 'prj_ofjirwxlFtrNItlWQ9Ivo5P9sIEU';
const TEAM_ID = 'team_MFdD8Lae2GAy1jTR4haMMB9q';
const TOKEN = 'vca_8TWQ67Dvcpyl4nwdBD9Y6IbaPKaYGHIetytJFxV7T5QvQPiLEP2IUeWf';

const BASE_URL = `https://api.vercel.com`;
const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

async function listEnvVars() {
  const url = `${BASE_URL}/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}&decrypt=true`;
  const res = await fetch(url, { headers });
  const data = await res.json();
  return data.envs || [];
}

async function createOrUpdateEnvVar(key, value, targets = ['production'], type = 'sensitive') {
  const existing = await listEnvVars();
  const existing_var = existing.find(e => e.key === key);
  
  if (existing_var) {
    // For sensitive vars, we must keep the same type
    const updateType = existing_var.type || type;
    console.log(`  [UPDATE] ${key} (id: ${existing_var.id}, type: ${updateType})`);
    const url = `${BASE_URL}/v9/projects/${PROJECT_ID}/env/${existing_var.id}?teamId=${TEAM_ID}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ value, target: targets, type: updateType }),
    });
    const data = await res.json();
    if (data.error) {
      console.log(`  ❌ Error updating ${key}: ${data.error.message}`);
      return false;
    } else {
      console.log(`  ✅ Updated ${key}`);
      return true;
    }
  } else {
    console.log(`  [CREATE] ${key} (type: ${type})`);
    const url = `${BASE_URL}/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ key, value, target: targets, type }),
    });
    const data = await res.json();
    if (data.error) {
      console.log(`  ❌ Error creating ${key}: ${data.error.message}`);
      return false;
    } else {
      console.log(`  ✅ Created ${key}`);
      return true;
    }
  }
}

async function getDecryptedEnvVar(id) {
  const url = `${BASE_URL}/v9/projects/${PROJECT_ID}/env/${id}?teamId=${TEAM_ID}&decrypt=true`;
  const res = await fetch(url, { headers });
  const data = await res.json();
  return data.value || null;
}

async function main() {
  console.log('=== NextFlow Vercel Environment Variable Audit (v2) ===\n');
  
  // List current env vars
  console.log('📋 Fetching current environment variables...');
  const envs = await listEnvVars();
  
  if (!envs || envs.length === 0) {
    console.log('❌ No env vars found or API error');
  } else {
    console.log(`\n📊 Found ${envs.length} environment variables:\n`);
    
    const keyVars = [
      'NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY',
      'NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID',
      'TRIGGER_DEV_ENABLED',
      'TRIGGER_SECRET_KEY',
      'TRIGGER_PROJECT_ID',
      'DATABASE_URL',
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'GOOGLE_GENERATIVE_AI_API_KEY',
      'NEXT_PUBLIC_CANDIDATE_LINKEDIN_URL',
    ];
    
    const varStatus = {};
    
    for (const key of keyVars) {
      const found = envs.filter(e => e.key === key);
      if (found.length > 0) {
        for (const e of found) {
          const target = (e.target || []).join(', ');
          // Try to get decrypted value for sensitive vars
          let valuePreview = '';
          if (e.value) {
            valuePreview = e.value.slice(0, 40) + (e.value.length > 40 ? '...' : '');
          } else if (e.id) {
            // Try to fetch decrypted value
            const decrypted = await getDecryptedEnvVar(e.id);
            if (decrypted) {
              valuePreview = decrypted.slice(0, 40) + (decrypted.length > 40 ? '...' : '');
              e.decryptedValue = decrypted;
            } else {
              valuePreview = '[ENCRYPTED - cannot decrypt]';
            }
          }
          console.log(`  ✅ ${key}`);
          console.log(`     Target: ${target}`);
          console.log(`     Type: ${e.type}`);
          console.log(`     Value preview: ${valuePreview}`);
          
          varStatus[key] = { exists: true, env: e, valuePreview };
          
          if (key === 'TRIGGER_SECRET_KEY') {
            const val = e.decryptedValue || e.value || valuePreview || '';
            if (val.startsWith('tr_prod_')) {
              console.log(`     🔑 TRIGGER_SECRET_KEY = tr_prod_* (production key — CORRECT)`);
              varStatus[key].triggerKeyType = 'tr_prod_';
            } else if (val.startsWith('tr_dev_')) {
              console.log(`     ⚠️  TRIGGER_SECRET_KEY = tr_dev_* (DEV key — needs replacement for production!)`);
              varStatus[key].triggerKeyType = 'tr_dev_';
            } else {
              const preview = val.slice(0, 10);
              console.log(`     ⚠️  TRIGGER_SECRET_KEY prefix: ${preview || 'unknown'}`);
              varStatus[key].triggerKeyType = 'unknown';
            }
          }
          
          // Check if Transloadit values match expected
          if (key === 'NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY') {
            const val = e.decryptedValue || e.value || '';
            const expected = '0885a78d304a8f7ba4eaa5457c0528be';
            if (val === expected) {
              console.log(`     ✅ Value matches expected`);
            } else if (val) {
              console.log(`     ⚠️  Value DIFFERS from expected (${val.slice(0, 8)}... vs ${expected.slice(0, 8)}...)`);
            }
          }
          if (key === 'NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID') {
            const val = e.decryptedValue || e.value || '';
            const expected = 'ee6daa29278049b38a6d8d7c25dc20ae';
            if (val === expected) {
              console.log(`     ✅ Value matches expected`);
            } else if (val) {
              console.log(`     ⚠️  Value DIFFERS from expected (${val.slice(0, 8)}... vs ${expected.slice(0, 8)}...)`);
            }
          }
        }
      } else {
        console.log(`  ❌ ${key} — MISSING`);
        varStatus[key] = { exists: false };
      }
    }
    
    // All found env vars
    console.log('\n📋 All env var keys set on project:');
    envs.forEach(e => console.log(`   - ${e.key} [${(e.target || []).join(', ')}] (${e.type})`));
  }
  
  console.log('\n=== Applying Required Updates ===\n');
  
  // Required env var updates
  const updates = [
    { key: 'NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY', value: '0885a78d304a8f7ba4eaa5457c0528be', type: 'sensitive' },
    { key: 'NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID', value: 'ee6daa29278049b38a6d8d7c25dc20ae', type: 'sensitive' },
    { key: 'TRIGGER_DEV_ENABLED', value: 'true', type: 'plain' },
  ];
  
  for (const update of updates) {
    console.log(`\nProcessing: ${update.key}`);
    await createOrUpdateEnvVar(update.key, update.value, ['production', 'preview', 'development'], update.type);
  }
  
  // Final verification
  console.log('\n=== Post-Update Final Env Var List ===\n');
  const finalEnvs = await listEnvVars();
  console.log('All env vars after update:');
  finalEnvs.forEach(e => {
    const val = (e.value || '').slice(0, 20);
    console.log(`   - ${e.key} [${(e.target || []).join(', ')}] (${e.type}) = "${val}${(e.value?.length || 0) > 20 ? '...' : ''}"`);
  });
  
  console.log('\n✅ Script complete.');
}

main().catch(console.error);
