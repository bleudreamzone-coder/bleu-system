const STATIC_ZIP_CENTROIDS = Object.freeze({
  '70130': { zip: '70130', city: 'New Orleans', state: 'LA', lat: 29.9431, lng: -90.0701 },
  '71457': { zip: '71457', city: 'Natchitoches', state: 'LA', lat: 31.7607, lng: -93.0863 }
});

const STATIC_CITY_ZIP = Object.freeze({
  'new orleans': '70130',
  nola: '70130',
  natchitoches: '71457'
});

const STATIC_SUBDOMAIN_ZIP = Object.freeze({
  neworleans: '70130',
  'new-orleans': '70130',
  nola: '70130',
  natchitoches: '71457'
});

const SOFT_IP_DEFAULT = Object.freeze({
  zip: '70130',
  city: 'New Orleans',
  state: 'LA',
  lat: 29.9431,
  lng: -90.0701
});

function normalizeZip(value) {
  const match = String(value || '').match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1] : null;
}

function normalizeCity(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstHeader(headers, name) {
  if (!headers) return '';
  const lower = name.toLowerCase();
  if (typeof headers.get === 'function') return headers.get(name) || headers.get(lower) || '';
  return headers[name] || headers[lower] || '';
}

function firstForwardedIp(headers) {
  const raw = firstHeader(headers, 'x-forwarded-for');
  return String(raw || '').split(',')[0].trim();
}

function hostSubdomainZip(headers) {
  const host = String(firstHeader(headers, 'host') || '').split(':')[0].toLowerCase();
  if (!host || host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  const parts = host.split('.');
  if (parts.length < 3) return null;
  const subdomain = parts[0];
  return STATIC_SUBDOMAIN_ZIP[subdomain] || null;
}

function entryCandidate(url, headers) {
  const zip = normalizeZip(url.searchParams.get('zip'));
  if (zip) return { type: 'zip', value: zip, entry_source: 'query_zip' };

  const loc = url.searchParams.get('loc') || url.searchParams.get('location') || url.searchParams.get('city');
  const locZip = normalizeZip(loc);
  if (locZip) return { type: 'zip', value: locZip, entry_source: 'query_loc' };

  const city = normalizeCity(loc);
  if (city) return { type: 'city', value: city, entry_source: 'query_loc' };

  const subdomainZip = hostSubdomainZip(headers);
  if (subdomainZip) return { type: 'zip', value: subdomainZip, entry_source: 'subdomain' };

  return null;
}

function toLocation(row, confidence, source, details = {}) {
  const zip = row?.zip ? String(row.zip) : null;
  const lat = row?.lat == null ? null : Number(row.lat);
  const lng = row?.lng == null ? null : Number(row.lng);
  return {
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    zip,
    confidence,
    source,
    city: row?.city || null,
    state: row?.state || null,
    provider_names_allowed: confidence === 'high',
    browser_geo: 'stub',
    ...details
  };
}

async function fetchJson(url, headers, fetchImpl) {
  if (!fetchImpl) return null;
  const response = await fetchImpl(url, { headers });
  if (!response || !response.ok) return null;
  const data = await response.json().catch(() => null);
  return Array.isArray(data) ? data : null;
}

async function lookupZipCentroid(zip, opts) {
  const staticRow = STATIC_ZIP_CENTROIDS[zip] || null;
  if (!opts.supabaseUrl || !opts.supabaseKey || !opts.fetchImpl) {
    return staticRow ? { row: staticRow, lookup_source: 'static_fallback' } : null;
  }

  const params = new URLSearchParams({
    select: 'zip,city,state,lat,lng',
    zip: `eq.${zip}`,
    limit: '1'
  });
  const rows = await fetchJson(`${opts.supabaseUrl}/rest/v1/zip_centroids?${params}`, {
    apikey: opts.supabaseKey,
    Authorization: `Bearer ${opts.supabaseKey}`,
    'Content-Type': 'application/json'
  }, opts.fetchImpl).catch(() => null);

  if (rows && rows[0]) return { row: rows[0], lookup_source: 'zip_centroids' };
  return staticRow ? { row: staticRow, lookup_source: 'static_fallback' } : null;
}

async function lookupCityCentroid(city, opts) {
  const staticZip = STATIC_CITY_ZIP[city] || null;
  if (!opts.supabaseUrl || !opts.supabaseKey || !opts.fetchImpl) {
    return staticZip ? lookupZipCentroid(staticZip, opts) : null;
  }

  const params = new URLSearchParams({
    select: 'zip,city,state,lat,lng',
    city: `ilike.*${city}*`,
    order: 'zip.asc',
    limit: '1'
  });
  const rows = await fetchJson(`${opts.supabaseUrl}/rest/v1/zip_centroids?${params}`, {
    apikey: opts.supabaseKey,
    Authorization: `Bearer ${opts.supabaseKey}`,
    'Content-Type': 'application/json'
  }, opts.fetchImpl).catch(() => null);

  if (rows && rows[0]) return { row: rows[0], lookup_source: 'zip_centroids' };
  return staticZip ? lookupZipCentroid(staticZip, opts) : null;
}

async function resolveLocation(input = {}) {
  const requestUrl = input.url instanceof URL
    ? input.url
    : new URL(input.url || '/', 'http://localhost');
  const headers = input.headers || {};
  const opts = {
    supabaseUrl: input.supabaseUrl || '',
    supabaseKey: input.supabaseKey || '',
    fetchImpl: input.fetchImpl || globalThis.fetch
  };

  const entry = entryCandidate(requestUrl, headers);
  if (entry) {
    const lookup = entry.type === 'city'
      ? await lookupCityCentroid(entry.value, opts)
      : await lookupZipCentroid(entry.value, opts);
    if (lookup?.row) {
      return toLocation(lookup.row, 'high', 'entry', {
        entry_source: entry.entry_source,
        lookup_source: lookup.lookup_source
      });
    }
    return toLocation({ zip: entry.type === 'zip' ? entry.value : null }, 'low', 'entry', {
      entry_source: entry.entry_source,
      lookup_source: 'not_found'
    });
  }

  return toLocation(SOFT_IP_DEFAULT, 'low', 'ip', {
    ip_present: Boolean(firstForwardedIp(headers)),
    lookup_source: 'soft_default'
  });
}

module.exports = {
  resolveLocation,
  normalizeZip,
  STATIC_ZIP_CENTROIDS
};
