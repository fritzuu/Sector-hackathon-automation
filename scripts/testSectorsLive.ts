const API_KEY = process.env.SECTORS_API_KEY || process.env.VITE_SECTORS_API_KEY || '';

async function test(name: string, url: string) {
  try {
    const res = await fetch(url, {
      headers: { 'Authorization': API_KEY, 'Content-Type': 'application/json' },
    });
    console.log(`${name}: ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log(`Data:`, JSON.stringify(Array.isArray(data) ? data.slice(0, 1) : data, null, 2).slice(0, 250));
    }
  } catch (e: any) {}
}

async function run() {
  await test('Sector Performance', 'https://api.sectors.app/v2/sectors/');
  await test('Top Companies by Market Cap', 'https://api.sectors.app/v2/companies/top/?by=market_cap');
  await test('Top Companies Ranking', 'https://api.sectors.app/v2/companies/top/');
  await test('Company Overview', 'https://api.sectors.app/v2/company/overview/BBCA/');
}

run();
