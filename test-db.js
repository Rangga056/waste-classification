const { Client } = require('pg');

async function test(port, postfix) {
  const url = `postgresql://postgres.gcrhlukrsrzxzztqgcbl:ebHNWpD8v6TsoPYY@aws-0-ap-southeast-1.pooler.supabase.com:${port}/postgres${postfix}`;
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log(`Success on port ${port} ${postfix}`);
    await client.end();
  } catch (err) {
    console.log(`Failed on port ${port} ${postfix}:`, err.message);
  }
}

async function main() {
  await test(5432, '');
  await test(6543, '');
  await test(6543, '?pgbouncer=true');
  await test(5432, '?pgbouncer=true');
}

main();
