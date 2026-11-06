// Drafts the facilitator's note from what patients praise in a practice's Google reviews.
// Needs GOOGLE_PLACES_API_KEY (Google Cloud → APIs & Services → enable "Places API (New)" → Credentials).
// The draft is never sent on its own: the team reads it in the console and releases the report.

export const reviewsReady = () => !!process.env.GOOGLE_PLACES_API_KEY;

// Things patients praise, the words that signal them, and how we say it back.
const THEMES = [
  { say: "a friendly and welcoming team", words: /\b(friendly|welcom\w*|kind|warm|nice|pleasant|courteous|caring|polite|sweet)\b/i },
  { say: "care that feels gentle and pain-free", words: /\b(gentle|painless|pain[- ]free|didn'?t (feel|hurt)|no pain|light touch)\b/i },
  { say: "putting nervous patients at ease", words: /\b(anxi\w*|nervous|scared|fear\w*|phobi\w*|at ease|calm\w*|comfortable)\b/i },
  { say: "clear explanations of treatment", words: /\b(explain\w*|thorough|took (the )?time|answered (all )?(my )?questions|informative|patient with)\b/i },
  { say: "a clean and modern office", words: /\b(clean|modern|state[- ]of[- ]the[- ]art|spotless|beautiful office|new equipment|technology)\b/i },
  { say: "being on time", words: /\b(on time|no wait|didn'?t (have to )?wait|punctual|prompt|quick|efficient)\b/i },
  { say: "easy scheduling", words: /\b(easy to (book|schedule)|scheduling|flexib\w*|fit me in|same[- ]day|accommodat\w*)\b/i },
  { say: "great care for children and families", words: /\b(kids?|children|child|son|daughter|family|families)\b/i },
  { say: "skilled and professional work", words: /\b(professional|knowledgeable|skilled|expert\w*|excellent|amazing|great job|best dentist)\b/i },
  { say: "honest advice and fair pricing", words: /\b(honest|trust\w*|fair|reasonabl\w*|transparent|never push\w*|not pushy)\b/i },
];

function clip(t, words = 22) {
  const w = String(t || "").replace(/\s+/g, " ").trim().split(" ");
  if (w.length <= words) return w.join(" ");
  // prefer ending at a sentence inside the limit
  const cut = w.slice(0, words).join(" "), dot = cut.search(/[.!?][^.!?]*$/);
  return dot > 40 ? cut.slice(0, dot + 1) : cut + "…";
}
const join = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]);

// Finds the practice on Google and returns its rating, positive reviews, themes and a draft note.
export async function reviewsFor({ name, town, website }) {
  if (!reviewsReady()) throw Object.assign(new Error("Google reviews aren’t switched on yet (GOOGLE_PLACES_API_KEY is missing)."), { status: 503 });
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.reviews",
    },
    body: JSON.stringify({ textQuery: `${name} dentist ${town || ""} New Jersey`.trim(), maxResultCount: 5, languageCode: "en" }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) { console.error("Places error", res.status, JSON.stringify(j)); throw Object.assign(new Error("Google said: " + ((j.error && j.error.message) || res.status)), { status: 502 }); }
  const places = j.places || [];
  if (!places.length) return { found: false };
  // Prefer the result whose website matches the one they gave us, else Google's top match.
  const host = (u) => String(u || "").replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
  const p = (website && places.find((x) => host(x.websiteUri) && host(x.websiteUri) === host(website))) || places[0];
  const positives = (p.reviews || []).filter((r) => (r.rating || 0) >= 4)
    .map((r) => ({ rating: r.rating, text: (r.originalText && r.originalText.text) || (r.text && r.text.text) || "", author: (r.authorAttribution && r.authorAttribution.displayName) || "A patient", when: r.relativePublishTimeDescription || "" }))
    .filter((r) => r.text);
  const counts = THEMES.map((t) => ({ say: t.say, n: positives.filter((r) => t.words.test(r.text)).length })).filter((t) => t.n).sort((a, b) => b.n - a.n);
  const themes = counts.slice(0, 3).map((t) => t.say);
  const quote = positives.slice().sort((a, b) => (b.rating - a.rating) || (a.text.length - b.text.length)).find((r) => r.text.split(" ").length >= 6);
  const place = { name: (p.displayName && p.displayName.text) || name, address: p.formattedAddress || "", rating: p.rating || null, count: p.userRatingCount || 0, url: p.googleMapsUri || "" };
  return { found: true, place, positives, themes, draft: draftNote(place, themes, quote) };
}

export function draftNote(place, themes, quote) {
  const parts = [];
  if (place.rating && place.count) parts.push(`Patients rate ${place.name} ${place.rating.toFixed(1)} out of 5 across ${place.count.toLocaleString("en-US")} Google reviews.`);
  if (themes.length) parts.push(`What they mention most: ${join(themes)}.`);
  if (quote) parts.push(`One patient wrote: “${clip(quote.text)}”`);
  if (parts.length) parts.push("That reputation is the strongest asset your team brings to the weekend, and we’ll build on it in your positioning session.");
  return parts.join(" ");
}
