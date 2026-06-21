import { Database } from 'bun:sqlite';
const db = new Database('C:/Users/shett/.gemini/antigravity-ide/opencode.db');
console.log(db.query(`SELECT name FROM sqlite_master WHERE type='table'`).all());
