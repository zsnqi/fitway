/* Eclipse: what the owner changes in the demo stays in this browser. Concept only; the pages have no server.
 * One localStorage entry: the log of saved changes (their ids, who, the reason as typed, what each did), the front
 * desk's state and the owners' states. A settings record holds the five values as saved, so Settings can name its change
 * from → to. Never a password and never a code: a record says only that one was set. gym.js reads the capacity and the
 * limits from here, so a page's levels follow them; the hours stay Settings' and Activity's (the gym's week is gym.js's).
 * Where storage is refused or holds something unreadable, nothing is kept and the pages work as they do without it.
 * A page opened with ?demo=reset clears the store and drops that parameter from the address; nothing on screen says so.
 * A review switch that draws another gym (a page names its own: ?case=, ?pin=, ?log=) neither reads nor writes here.
 * Every record stands at the demo's clock, gym.js's NOW, today. A classic script, loaded before gym.js. */
window.EclipseDemo = (() => {
  "use strict";
  const KEY = "fitway-demo";
  const FIRST_ID = 57, RESERVED = [1001, 1002];   // after Activity log's sample ids; it reserves these two for older records
  // A record's action, as Activity log's contract names it. The change of one's own password is an amendment (AMD-C1).
  const ACTIONS = { pinCreate: "staff_pin_provisioned", pinChange: "staff_pin_rotated", pinOff: "staff_pin_deactivated", add: "owner_provisioned", off: "owner_deactivated", on: "owner_reactivated", reset: "credential_reset", mine: "credential_changed" };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const address = new URL(location.href);

  if (address.searchParams.get("demo") === "reset") {
    try { localStorage.removeItem(KEY); } catch { /* refused: nothing was kept */ }
    address.searchParams.delete("demo");
    try { history.replaceState(history.state, "", address); } catch { /* file:// may refuse; the store is clear anyway */ }
  }

  const raw = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const soundSettings = (e) => e && Number.isInteger(e.capacity) && e.capacity > 0 && e.weeklySchedule && typeof e.businessDayBoundary === "string"
    && Number.isFinite(e.resetBufferMinutes) && e.thresholds && [e.thresholds.quietMaxPercent, e.thresholds.moderateMaxPercent, e.thresholds.busyMaxPercent].every(Number.isFinite);
  const soundRecord = (r) => r && Number.isInteger(r.id) && (r.kind === "settings" ? soundSettings(r.editable) : r.kind === "access" && ACTIONS[r.act]);
  function read() {
    const empty = { nextId: FIRST_ID, desk: null, owners: {}, log: [] };
    try {
      const s = JSON.parse(raw());
      return s && Number.isInteger(s.nextId) && s.owners && Array.isArray(s.log) && s.log.every(soundRecord) ? s : empty;
    } catch { return empty; }
  }
  let seen = raw();
  function write(change) {
    const s = read();
    change(s);
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* refused: the page goes on with what it shows */ }
    seen = raw();
  }
  // A page the browser kept whole (Back) comes back as it was left, so it reads the store again if a change came since.
  addEventListener("pageshow", (e) => { if (e.persisted && raw() !== seen) location.reload(); });

  const reasonOf = (text) => (text ? String(text) : null);
  let session = FIRST_ID;

  // The store as one page uses it: `fixtures` are the page's review switches that draw another gym.
  function page(fixtures = []) {
    const live = !fixtures.some((k) => address.searchParams.has(k));
    const records = (kind) => (live ? read().log.filter((r) => r.kind === kind) : []);
    return {
      live,
      records,
      // The session's next record id, shared by Access and Settings so Activity log finds each one.
      nextId() {
        let id = Math.max(session, live ? read().nextId : FIRST_ID);
        while (RESERVED.includes(id)) id++;
        session = id + 1;
        return id;
      },
      // Activity log's rows, oldest first.
      log: () => (live ? read().log : []).map((r) => ({ id: r.id, kind: r.kind, by: r.by, reason: r.reason, lang: r.lang,
        action: r.kind === "settings" ? "settings_updated" : ACTIONS[r.act], target: r.kind === "access" ? (r.act.startsWith("pin") ? "desk" : r.target) : undefined })),
      // The names of owners added here, as the log prints them: typed text, so escaped.
      names: () => Object.fromEntries(Object.entries(live ? read().owners : {}).filter(([, o]) => o.name).map(([id, o]) => [id, esc(o.name)])),
      loadAccess(data) {
        if (!live) return;
        const s = read();
        if (s.desk) data.desk.state = s.desk;
        for (const [id, o] of Object.entries(s.owners)) {
          const known = data.owners.find((x) => x.id === id);
          if (known) known.active = Boolean(o.active);
          else if (o.name) data.owners.push({ id, name: String(o.name), email: String(o.email), active: Boolean(o.active) });
        }
      },
      // Access's card, newest first.
      accessRecords: () => records("access").reverse().map((r) => ({ id: r.id, date: EclipseGym.NOW.date, mins: EclipseGym.NOW.clock, by: r.by, act: r.act, target: r.target, reason: r.reason })),
      saveAccess(rec, desk, owner) {
        if (!live) return;
        write((s) => {
          s.nextId = Math.max(s.nextId, rec.id + 1);
          s.desk = desk;
          // A name and an email only for an owner added here (their ids start with n); the sample's owners are gym data.
          if (owner) s.owners[owner.id] = owner.id.startsWith("n") ? { active: owner.active, name: owner.name, email: owner.email } : { active: owner.active };
          s.log.push({ id: rec.id, kind: "access", act: rec.act, target: rec.target, by: rec.by, reason: reasonOf(rec.reason), lang: document.documentElement.lang });
        });
      },
      saveSettings(v) {
        if (!live) return;
        write((s) => {
          s.nextId = Math.max(s.nextId, v.id + 1);
          s.log.push({ id: v.id, kind: "settings", by: v.by, reason: reasonOf(v.reason && v.reason.raw), lang: document.documentElement.lang, editable: v.editable });
        });
      },
    };
  }
  // The five values as last saved, or null: what gym.js reads, on every page.
  function settings() {
    const saved = read().log.filter((r) => r.kind === "settings");
    return saved.length ? saved[saved.length - 1].editable : null;
  }
  return { page, settings, esc };
})();
