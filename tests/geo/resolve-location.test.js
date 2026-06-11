const assert = require('node:assert/strict');
const { resolveLocation, normalizeZip } = require('../../core/geo/resolveLocation');

async function main() {
  assert.equal(normalizeZip('71457'), '71457');
  assert.equal(normalizeZip('ZIP 71457-1234'), '71457');
  assert.equal(normalizeZip('no zip'), null);

  const zipEntry = await resolveLocation({
    url: 'http://localhost/geo?zip=71457',
    fetchImpl: null
  });
  assert.equal(zipEntry.confidence, 'high');
  assert.equal(zipEntry.source, 'entry');
  assert.equal(zipEntry.entry_source, 'query_zip');
  assert.equal(zipEntry.lookup_source, 'static_fallback');
  assert.equal(zipEntry.zip, '71457');
  assert.equal(zipEntry.provider_names_allowed, true);
  assert.equal(typeof zipEntry.lat, 'number');
  assert.equal(typeof zipEntry.lng, 'number');

  const cityEntry = await resolveLocation({
    url: 'http://localhost/geo?loc=Natchitoches',
    fetchImpl: null
  });
  assert.equal(cityEntry.confidence, 'high');
  assert.equal(cityEntry.source, 'entry');
  assert.equal(cityEntry.zip, '71457');

  const subdomainEntry = await resolveLocation({
    url: 'https://natchitoches.bleu.live/geo',
    headers: { host: 'natchitoches.bleu.live' },
    fetchImpl: null
  });
  assert.equal(subdomainEntry.confidence, 'high');
  assert.equal(subdomainEntry.source, 'entry');
  assert.equal(subdomainEntry.entry_source, 'subdomain');
  assert.equal(subdomainEntry.zip, '71457');

  const noEntry = await resolveLocation({
    url: 'http://localhost/geo',
    headers: { 'x-forwarded-for': '203.0.113.7' },
    fetchImpl: null
  });
  assert.equal(noEntry.confidence, 'low');
  assert.equal(noEntry.source, 'ip');
  assert.equal(noEntry.lookup_source, 'soft_default');
  assert.equal(noEntry.provider_names_allowed, false);
  assert.equal(noEntry.ip_present, true);
  assert.equal(noEntry.zip, '70130');

  let requestedUrl = '';
  const dbEntry = await resolveLocation({
    url: 'http://localhost/geo?zip=71457',
    supabaseUrl: 'https://example.supabase.co',
    supabaseKey: 'test-key',
    fetchImpl: async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        async json() {
          return [{ zip: '71457', city: 'Natchitoches', state: 'LA', lat: 31.76, lng: -93.09 }];
        }
      };
    }
  });
  assert.match(requestedUrl, /\/rest\/v1\/zip_centroids\?/);
  assert.equal(dbEntry.lookup_source, 'zip_centroids');
  assert.equal(dbEntry.confidence, 'high');
  assert.equal(dbEntry.source, 'entry');
  assert.equal(dbEntry.provider_names_allowed, true);

  console.log('resolveLocation tests passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
