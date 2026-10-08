/*
 * Milk Browser — ad blocking.
 *
 * First choice: @cliqz/adblocker-electron with its prebuilt filter lists
 * (EasyList + EasyPrivacy + others), fetched once and cached by the library.
 * Fallback: if the lists can't be fetched (offline, CDN blocked), a small
 * built-in domain blocklist still kills the most common ad/tracker hosts.
 * Either way, browsing keeps working — blocking just gets less thorough.
 */
'use strict';

// Common ad/tracker hosts for the offline fallback. Deliberately short:
// this is a safety net, not a replacement for the real filter lists.
const FALLBACK_HOSTS = [
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'google-analytics.com',
  'googletagmanager.com',
  'googletagservices.com',
  'adservice.google.com',
  'ads.yahoo.com',
  'advertising.com',
  'adsystem.com',
  'amazon-adsystem.com',
  'criteo.com',
  'criteo.net',
  'outbrain.com',
  'taboola.com',
  'scorecardresearch.com',
  'quantserve.com',
  'hotjar.com',
  'fullstory.com',
  'facebook.net', // pixel/tracker endpoints (not facebook.com itself)
  'connect.facebook.net',
];

function enableFallback(sess) {
  sess.webRequest.onBeforeRequest((details, callback) => {
    let host = '';
    try {
      host = new URL(details.url).hostname.toLowerCase();
    } catch {
      callback({});
      return;
    }
    const blocked = FALLBACK_HOSTS.some((h) => host === h || host.endsWith('.' + h));
    callback(blocked ? { cancel: true } : {});
  });
  console.log('[adblock] fallback domain blocklist active');
}

async function setupAdblock(sess) {
  try {
    const { ElectronBlocker } = require('@ghostery/adblocker-electron');
    const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
    blocker.enableBlockingInSession(sess);
    console.log('[adblock] prebuilt filter engine active');
  } catch (err) {
    console.warn('[adblock] prebuilt lists unavailable:', err.message);
    enableFallback(sess);
  }
}

module.exports = { setupAdblock };
