// On SSP a released Practice Snapshot is published to the public key-value store, so the
// office can open it without signing in. The store can be listed by anyone, so each report
// is stored encrypted (AES-GCM) under a name derived from the private report key in the
// office's link. Without the link, the stored value is unreadable and can't be found.
// Works in the browser and in Node 18+ (Web Crypto).

const te = new TextEncoder(), td = new TextDecoder();
const subtle = () => globalThis.crypto.subtle;
const b64 = (bytes) => { let s = ""; bytes.forEach((b) => { s += String.fromCharCode(b); }); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function material(reportKey) {
  const digest = await subtle().digest("SHA-256", te.encode("pls-report:" + reportKey));
  const name = "report_" + hex(await subtle().digest("SHA-256", digest)).slice(0, 40);
  const key = await subtle().importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
  return { name, key };
}

// The store key a report lives under.
export async function reportSlot(reportKey) { return (await material(reportKey)).name; }

export async function sealReport(reportKey, data) {
  const { name, key } = await material(reportKey);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await subtle().encrypt({ name: "AES-GCM", iv }, key, te.encode(JSON.stringify(data))));
  return { name, value: { v: 1, iv: b64(iv), ct: b64(ct) } };
}

export async function openReport(reportKey, value) {
  if (!value || !value.iv || !value.ct) return null;
  const { key } = await material(reportKey);
  try {
    const pt = await subtle().decrypt({ name: "AES-GCM", iv: unb64(value.iv) }, key, unb64(value.ct));
    return JSON.parse(td.decode(pt));
  } catch { return null; }
}
