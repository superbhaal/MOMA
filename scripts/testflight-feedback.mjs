#!/usr/bin/env node
/**
 * Read TestFlight feedback — screenshots and crashes — from App Store Connect.
 *
 * Testers write their notes inside TestFlight, not to us, so the only way to
 * see them is the API. Screenshot submissions carry the tester's comment, her
 * device and OS, and the images she annotated; crash submissions carry the
 * trace.
 *
 * Auth is an ES256 JWT signed with the .p8 key, valid 20 minutes. No
 * dependencies: node's crypto signs it, and the token never leaves this
 * process.
 *
 *   ASC_ISSUER_ID=<uuid> node scripts/testflight-feedback.mjs [version]
 *
 * The issuer id is in App Store Connect → Users and Access → Integrations →
 * App Store Connect API, above the key list. It is not a secret in the way the
 * .p8 is, but it is not in the repo either — pass it in the environment.
 */

import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const KEY_ID = process.env.ASC_KEY_ID ?? '5F374C35ZB';
const ISSUER_ID = process.env.ASC_ISSUER_ID;
const APP_ID = process.env.ASC_APP_ID ?? '6796478985';
const wantedVersion = process.argv[2] ?? null;

if (!ISSUER_ID) {
  console.error(
    'ASC_ISSUER_ID manquant.\n' +
      'App Store Connect → Users and Access → Integrations → App Store Connect API,\n' +
      "l'UUID affiché au-dessus de la liste des clés.",
  );
  process.exit(2);
}

const keyPath = join(homedir(), '.appstoreconnect', 'private_keys', `AuthKey_${KEY_ID}.p8`);
const privateKey = readFileSync(keyPath, 'utf8');

/** ES256 JWT, hand-rolled — the payload is three fields and a signature. */
function token() {
  const b64 = (o) =>
    Buffer.from(JSON.stringify(o)).toString('base64url');
  const header = b64({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' });
  const now = Math.floor(Date.now() / 1000);
  const payload = b64({
    iss: ISSUER_ID,
    iat: now,
    exp: now + 20 * 60,
    aud: 'appstoreconnect-v1',
  });
  const signer = createSign('SHA256');
  signer.update(`${header}.${payload}`);
  // ASC wants the raw r||s pair, not the DER envelope openssl produces.
  const sig = signer.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' });
  return `${header}.${payload}.${Buffer.from(sig).toString('base64url')}`;
}

const JWT = token();

async function get(path) {
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    headers: { Authorization: `Bearer ${JWT}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${path}\n${body.slice(0, 400)}`);
  }
  return res.json();
}

const dt = (s) => (s ? new Date(s).toLocaleString('fr-FR') : '—');

async function main() {
  // Builds first: feedback is per-build, and we want to know which is live.
  const builds = await get(
    `/v1/builds?filter[app]=${APP_ID}&limit=10&sort=-version` +
      `&fields[builds]=version,uploadedDate,processingState,expired`,
  );
  console.log('\n═══ BUILDS ═══');
  for (const b of builds.data) {
    const a = b.attributes;
    console.log(
      `  build ${a.version.padEnd(4)} ${a.processingState.padEnd(11)} ` +
        `${dt(a.uploadedDate)}${a.expired ? '  (expiré)' : ''}`,
    );
  }

  for (const [label, endpoint] of [
    ['CAPTURES ET COMMENTAIRES', 'betaFeedbackScreenshotSubmissions'],
    ['PLANTAGES', 'betaFeedbackCrashSubmissions'],
  ]) {
    console.log(`\n═══ ${label} ═══`);
    let page;
    try {
      page = await get(
        `/v1/apps/${APP_ID}/${endpoint}?limit=50&sort=-createdDate` +
          `&include=build,tester`,
      );
    } catch (e) {
      console.log(`  (indisponible : ${String(e.message).split('\n')[0]})`);
      continue;
    }

    // The build a submission belongs to lives in `included`, not inline.
    const included = new Map((page.included ?? []).map((i) => [`${i.type}:${i.id}`, i]));
    const rows = page.data ?? [];
    if (!rows.length) {
      console.log('  (aucun retour)');
      continue;
    }

    for (const s of rows) {
      const a = s.attributes ?? {};
      const bRef = s.relationships?.build?.data;
      const b = bRef ? included.get(`builds:${bRef.id}`) : null;
      const version = b?.attributes?.version ?? '?';
      if (wantedVersion && version !== wantedVersion) continue;

      const tRef = s.relationships?.tester?.data;
      const t = tRef ? included.get(`betaTesters:${tRef.id}`) : null;
      const who = t
        ? `${t.attributes?.firstName ?? ''} ${t.attributes?.lastName ?? ''}`.trim() ||
          t.attributes?.email
        : '—';

      console.log(`\n  ── build ${version} · ${dt(a.createdDate)} · ${who}`);
      if (a.deviceModel || a.osVersion) {
        console.log(`     ${[a.deviceModel, a.osVersion, a.locale].filter(Boolean).join(' · ')}`);
      }
      if (a.comment) console.log(`     « ${a.comment} »`);
      if (a.crashLog) console.log(`     trace: ${String(a.crashLog).slice(0, 300)}`);
      for (const img of a.screenshots ?? []) {
        console.log(`     capture: ${img.url}`);
      }
    }
  }
  console.log('');
}

main().catch((e) => {
  console.error(`\nÉchec : ${e.message}\n`);
  process.exit(1);
});
