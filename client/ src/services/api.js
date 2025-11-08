// client/src/services/api.js
// ---------------------------------------------------
// API service layer for MindsEye Agentic Dashboard
// Handles requests to the backend (Express server)
// ---------------------------------------------------

// Use env variable if provided, otherwise default to localhost:4000
const BASE = import.meta.env.VITE_API_BASE?.trim() || 'http://localhost:4000';

// Small helper for GET requests returning JSON
async function json(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

// ---------------------------------------------------
// Main API endpoints used across the client
// ---------------------------------------------------
export const api = {
  // GET /events — fetch recent events
  async getEvents(limit = 100) {
    return json(`${BASE}/events?limit=${limit}`);
  },

  // GET /events/stats — fetch aggregated data
  async getStats(bucket = 'minute', minutes = 60) {
    return json(`${BASE}/events/stats?bucket=${bucket}&minutes=${minutes}`);
  },

  // GET /events/search — perform text/trigram search
  async search(q, limit = 50) {
    const u = new URL(`${BASE}/events/search`);
    u.searchParams.set('q', q);
    u.searchParams.set('limit', String(limit));
    return json(u.toString());
  },

  // POST /events — insert a new event (optional helper)
  async createEvent(payload) {
    const res = await fetch(`${BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  },
};
