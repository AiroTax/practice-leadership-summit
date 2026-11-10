// /api/admin — everything the team console reads and changes. Signed-in team members only.
// The work itself is in ./_lib/team-desk.js, shared with the SSP bridge.
import { readBody, send } from "./_lib/airtable.js";
import { sessionEmail } from "./_lib/auth.js";
import { consoleRequest, SYSTEM_EMAILS } from "./_lib/team-desk.js";

export { SYSTEM_EMAILS };
export default async function handler(req, res) {
  const [status, body] = await consoleRequest(req.method, req.method === "POST" ? readBody(req) : null, sessionEmail(req));
  return send(res, status, body);
}
