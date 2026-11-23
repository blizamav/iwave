import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// Solo claves HMAC, contadores y fechas. Sin mensajes, correos, IP ni tokens en claro.
export class Store {
  constructor(path) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000;
      CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS deliveries (key TEXT PRIMARY KEY, status TEXT NOT NULL, expires INTEGER NOT NULL, locked_until INTEGER NOT NULL);`);
  }
  cleanup(now) {
    this.db.prepare('DELETE FROM limits WHERE expires <= ?').run(now);
    this.db.prepare('DELETE FROM deliveries WHERE expires <= ?').run(now);
  }
  consume(key, max, expires) {
    const row = this.db.prepare('SELECT count FROM limits WHERE key = ?').get(key);
    if (row && row.count >= max) return false;
    this.db.prepare('INSERT INTO limits VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key, expires);
    return true;
  }
  reserve(key, now) {
    const row = this.db.prepare('SELECT * FROM deliveries WHERE key = ?').get(key);
    if (row?.status === 'accepted') return 'accepted';
    if (row?.status === 'uncertain') return 'uncertain';
    if (row && row.locked_until > now) return 'pending';
    this.db.prepare(`INSERT INTO deliveries VALUES (?, 'pending', ?, ?) ON CONFLICT(key) DO UPDATE SET locked_until=excluded.locked_until`).run(key, now + 86400000, now + 60000);
    return 'new';
  }
  accept(key) { this.db.prepare("UPDATE deliveries SET status='accepted', locked_until=0 WHERE key=?").run(key); }
  uncertain(key) { this.db.prepare("UPDATE deliveries SET status='uncertain', locked_until=expires WHERE key=?").run(key); }
  release(key) { this.db.prepare("UPDATE deliveries SET status='pending', locked_until=0 WHERE key=?").run(key); }
  close() { this.db.close(); }
}
