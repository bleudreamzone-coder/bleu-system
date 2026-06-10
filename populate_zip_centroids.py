#!/usr/bin/env python3
"""
Populate public.zip_centroids with ~41k US ZIP centroids from GeoNames (CC-BY).
Source: https://download.geonames.org/export/zip/US.zip
Safe to re-run (upserts on zip primary key).
"""
import io, os, sys, json, zipfile, urllib.request, urllib.error

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://sqyzboesdpdussiwqpzk.supabase.co")
SERVICE_KEY  = os.environ.get("SUPABASE_SERVICE_KEY", "")
GEONAMES_URL = "https://download.geonames.org/export/zip/US.zip"
BATCH = 1000

if not SERVICE_KEY:
    sys.exit("SUPABASE_SERVICE_KEY not set in env")

def fetch_rows():
    print("Downloading GeoNames US postal data...")
    with urllib.request.urlopen(GEONAMES_URL, timeout=120) as resp:
        data = resp.read()
    raw = zipfile.ZipFile(io.BytesIO(data)).read("US.txt").decode("utf-8")
    rows = {}
    for line in raw.splitlines():
        p = line.split("\t")
        if len(p) < 11:
            continue
        zip_code = p[1].strip()
        if not zip_code or zip_code in rows:
            continue
        try:
            lat, lng = float(p[9]), float(p[10])
        except ValueError:
            continue
        rows[zip_code] = {"zip": zip_code, "city": p[2].strip(),
                          "state": p[4].strip(), "lat": lat, "lng": lng}
    return list(rows.values())

def upsert(batch):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/zip_centroids",
        data=json.dumps(batch).encode("utf-8"), method="POST")
    req.add_header("apikey", SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SERVICE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "resolution=merge-duplicates,return=minimal")
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status
    except urllib.error.HTTPError as e:
        print("  ERROR", e.code, e.read().decode("utf-8", "ignore")[:300])
        raise

def main():
    rows = fetch_rows()
    print(f"Parsed {len(rows)} unique US zips. Upserting in batches of {BATCH}...")
    done = 0
    for i in range(0, len(rows), BATCH):
        chunk = rows[i:i+BATCH]
        upsert(chunk)
        done += len(chunk)
        print(f"  {done}/{len(rows)}")
    print(f"Done. {done} rows in zip_centroids.")

if __name__ == "__main__":
    main()
