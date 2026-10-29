// backend_tasks/dummydata/seedDemoData.js
//
// Idempotent demo-data seeder for TaskFlow.
//   npm run seed:demo-data                    -> seed (reuses anything that already exists)
//   npm run seed:demo-data -- --refresh-dates -> also re-base due dates of existing demo
//                                                projects/tasks to today's date
//
// Safety:
//   - Refuses to run unless DB_HOST is localhost / 127.0.0.1 / ::1
//   - Never truncates, deletes, resets IDs or alters the schema
//   - Whole run is one transaction; any error rolls everything back
//   - Never logs passwords or password hashes
//
// ---- ASSUMPTIONS TO CONFIRM (edit here if your project differs) ----
//   * ES modules (dummyusers.js uses `export default`)
//   * mysql2 and bcryptjs are installed; dotenv is optional
//   * DB env var names: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT (optional)
//   * bcrypt cost factor 10
//   * dummyusers.js entries use { username, email, password }; `username` goes in users.name
// --------------------------------------------------------------------

import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dummyUsers from './dummyusers.js';
import { demoWorkspaces } from './demoDataset.js';

try {
  await import('dotenv/config'); // loads .env from the current working directory if dotenv exists
} catch {
  /* dotenv not installed: rely on real environment variables */
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const BCRYPT_ROUNDS = 10;
const REFRESH_DATES = process.argv.includes('--refresh-dates');

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ROLES = ['owner', 'admin', 'member', 'viewer'];
const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'archived'];
const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

class SeedConflictError extends Error {}

const counter = () => ({ created: 0, reused: 0 });
const stats = {
  users: counter(),
  workspaces: counter(),
  memberships: counter(),
  projects: counter(),
  tasks: counter(),
};

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function dateFromOffset(days) {
  if (days === null || days === undefined) return null;
  const d = new Date();
  d.setDate(d.getDate() + days);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function enumValues(columnType) {
  return [...String(columnType).matchAll(/'([^']*)'/g)].map((m) => m[1]);
}

// ---------------------------------------------------------------
// Static validation of the dataset (no database needed)
// ---------------------------------------------------------------
function validateDataset() {
  const problems = [];
  const knownEmails = new Set(dummyUsers.map((u) => u.email.toLowerCase()));
  const slugs = new Set();
  const owners = new Set();

  for (const ws of demoWorkspaces) {
    const where = `workspace "${ws.name}"`;
    if (ws.name.length > 100) problems.push(`${where}: name longer than 100 chars`);
    if (!SLUG_RE.test(ws.slug) || ws.slug.length > 100) problems.push(`${where}: invalid slug "${ws.slug}"`);
    if (slugs.has(ws.slug)) problems.push(`${where}: duplicate slug`);
    slugs.add(ws.slug);
    if (owners.has(ws.owner)) problems.push(`${where}: owner already owns another demo workspace`);
    owners.add(ws.owner);

    const roles = new Map([[ws.owner, 'owner']]);
    for (const m of ws.members) {
      if (!ROLES.includes(m.role) || m.role === 'owner') problems.push(`${where}: invalid member role "${m.role}" for ${m.email}`);
      if (roles.has(m.email)) problems.push(`${where}: ${m.email} listed twice`);
      roles.set(m.email, m.role);
    }
    for (const email of roles.keys()) {
      if (!knownEmails.has(email)) problems.push(`${where}: ${email} is not in dummyusers.js`);
    }

    const isManager = (email) => ['owner', 'admin'].includes(roles.get(email));
    const projectNames = new Set();
    for (const p of ws.projects) {
      const pw = `${where} / project "${p.name}"`;
      if (p.name.length > 150) problems.push(`${pw}: name longer than 150 chars`);
      if (projectNames.has(p.name)) problems.push(`${pw}: duplicate project name`);
      projectNames.add(p.name);
      if (!PROJECT_STATUSES.includes(p.status)) problems.push(`${pw}: invalid status "${p.status}"`);
      if (!isManager(p.createdBy)) problems.push(`${pw}: creator ${p.createdBy} is not owner/admin`);

      const titles = new Set();
      for (const t of p.tasks) {
        const tw = `${pw} / task "${t.title}"`;
        if (t.title.length > 200) problems.push(`${tw}: title longer than 200 chars`);
        if (titles.has(t.title)) problems.push(`${tw}: duplicate task title`);
        titles.add(t.title);
        if (!TASK_STATUSES.includes(t.status)) problems.push(`${tw}: invalid status "${t.status}"`);
        if (!TASK_PRIORITIES.includes(t.priority)) problems.push(`${tw}: invalid priority "${t.priority}"`);
        if (!isManager(t.createdBy)) problems.push(`${tw}: creator ${t.createdBy} is not owner/admin`);
        if (t.assignee && !roles.has(t.assignee)) problems.push(`${tw}: assignee ${t.assignee} is not a member of the workspace`);
      }
    }
  }
  if (problems.length) {
    throw new Error(`Demo dataset is invalid:\n - ${problems.join('\n - ')}`);
  }
}

// ---------------------------------------------------------------
// Live-schema preflight (never alters the schema)
// ---------------------------------------------------------------
async function preflight(conn) {
  const required = {
    users: ['id', 'name', 'email', 'password_hash'],
    workspaces: ['id', 'name', 'slug', 'owner_id'],
    workspace_members: ['workspace_id', 'user_id', 'role'],
    projects: ['id', 'workspace_id', 'created_by', 'name', 'description', 'status', 'due_date'],
    tasks: ['id', 'project_id', 'assignee_id', 'created_by', 'title', 'description', 'status', 'priority', 'due_date'],
  };

  const [cols] = await conn.query(
    `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, COLUMN_TYPE AS column_type
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (?)`,
    [Object.keys(required)]
  );
  const byTable = {};
  for (const c of cols) {
    byTable[c.table_name] ??= {};
    byTable[c.table_name][c.column_name] = c.column_type;
  }

  const missing = [];
  for (const [table, names] of Object.entries(required)) {
    if (!byTable[table]) {
      missing.push(`table ${table}`);
      continue;
    }
    for (const n of names) if (!(n in byTable[table])) missing.push(`${table}.${n}`);
  }
  if (missing.length) {
    throw new Error(
      `Schema check failed. Missing: ${missing.join(', ')}.\n` +
        'If projects.created_by is listed, apply that migration first; this seeder never alters the schema.'
    );
  }

  const [fk] = await conn.query(
    `SELECT 1 AS ok FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'created_by'
        AND REFERENCED_TABLE_NAME = 'users' AND REFERENCED_COLUMN_NAME = 'id'`
  );
  if (!fk.length) {
    throw new Error(
      'Schema check failed: projects.created_by has no foreign key to users.id. ' +
        'Apply the migration first; this seeder never alters the schema.'
    );
  }

  const used = (pick) => new Set(demoWorkspaces.flatMap(pick));
  const enumChecks = [
    ['workspace_members', 'role', used((w) => ['owner', ...w.members.map((m) => m.role)])],
    ['projects', 'status', used((w) => w.projects.map((p) => p.status))],
    ['tasks', 'status', used((w) => w.projects.flatMap((p) => p.tasks.map((t) => t.status)))],
    ['tasks', 'priority', used((w) => w.projects.flatMap((p) => p.tasks.map((t) => t.priority)))],
  ];
  for (const [table, column, values] of enumChecks) {
    const allowed = enumValues(byTable[table][column]);
    const bad = [...values].filter((v) => !allowed.includes(v));
    if (bad.length) {
      throw new Error(`Schema check failed: ${table}.${column} does not allow ${bad.join(', ')} (allowed: ${allowed.join(', ')}).`);
    }
  }
}

// ---------------------------------------------------------------
// Seeding steps (all use parameterized SQL)
// ---------------------------------------------------------------
async function ensureUsers(conn) {
  const ids = new Map();
  for (const u of dummyUsers) {
    const email = u.email.toLowerCase();
    const [rows] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length) {
      ids.set(email, rows[0].id);
      stats.users.reused++;
      continue;
    }
    const hash = await bcrypt.hash(u.password, BCRYPT_ROUNDS);
    const [res] = await conn.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [u.username ?? u.name, email, hash]
    );
    ids.set(email, res.insertId);
    stats.users.created++;
  }
  return ids;
}

async function ensureWorkspace(conn, ws, ownerId) {
  const [rows] = await conn.query('SELECT id, owner_id FROM workspaces WHERE slug = ?', [ws.slug]);
  if (rows.length) {
    if (rows[0].owner_id !== ownerId) {
      throw new SeedConflictError(
        `Workspace slug "${ws.slug}" already exists with a different owner (id ${rows[0].owner_id}); expected ${ws.owner}. Not overwriting.`
      );
    }
    stats.workspaces.reused++;
    return rows[0].id;
  }
  const [res] = await conn.query('INSERT INTO workspaces (name, slug, owner_id) VALUES (?, ?, ?)', [ws.name, ws.slug, ownerId]);
  stats.workspaces.created++;
  return res.insertId;
}

async function ensureMembership(conn, workspaceId, userId, role, label) {
  const [rows] = await conn.query(
    'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId]
  );
  if (rows.length) {
    if (rows[0].role !== role) {
      throw new SeedConflictError(`${label} already has role "${rows[0].role}" in this workspace; expected "${role}". Not overwriting.`);
    }
    stats.memberships.reused++;
    return;
  }
  await conn.query('INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)', [workspaceId, userId, role]);
  stats.memberships.created++;
}

async function ensureProject(conn, workspaceId, p, createdBy) {
  const dueDate = dateFromOffset(p.dueInDays);
  const [rows] = await conn.query('SELECT id, created_by FROM projects WHERE workspace_id = ? AND name = ?', [workspaceId, p.name]);
  if (rows.length) {
    if (rows[0].created_by !== createdBy) {
      throw new SeedConflictError(`Project "${p.name}" already exists with a different creator (id ${rows[0].created_by}). Not overwriting.`);
    }
    if (REFRESH_DATES) await conn.query('UPDATE projects SET due_date = ? WHERE id = ?', [dueDate, rows[0].id]);
    stats.projects.reused++;
    return rows[0].id;
  }
  const [res] = await conn.query(
    'INSERT INTO projects (workspace_id, created_by, name, description, status, due_date) VALUES (?, ?, ?, ?, ?, ?)',
    [workspaceId, createdBy, p.name, p.description, p.status, dueDate]
  );
  stats.projects.created++;
  return res.insertId;
}

async function ensureTask(conn, projectId, t, createdBy, assigneeId) {
  const dueDate = dateFromOffset(t.dueInDays);
  const [rows] = await conn.query('SELECT id, created_by FROM tasks WHERE project_id = ? AND title = ?', [projectId, t.title]);
  if (rows.length) {
    if (rows[0].created_by !== createdBy) {
      throw new SeedConflictError(`Task "${t.title}" already exists with a different creator (id ${rows[0].created_by}). Not overwriting.`);
    }
    if (REFRESH_DATES) await conn.query('UPDATE tasks SET due_date = ? WHERE id = ?', [dueDate, rows[0].id]);
    stats.tasks.reused++;
    return;
  }
  await conn.query(
    `INSERT INTO tasks (project_id, assignee_id, created_by, title, description, status, priority, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [projectId, assigneeId, createdBy, t.title, t.description, t.status, t.priority, dueDate]
  );
  stats.tasks.created++;
}

async function seed(conn) {
  const userIds = await ensureUsers(conn);
  const uid = (email) => {
    const id = userIds.get(email.toLowerCase());
    if (!id) throw new Error(`User ${email} not found after seeding users.`);
    return id;
  };

  for (const ws of demoWorkspaces) {
    const workspaceId = await ensureWorkspace(conn, ws, uid(ws.owner));
    await ensureMembership(conn, workspaceId, uid(ws.owner), 'owner', `Owner ${ws.owner}`);
    for (const m of ws.members) {
      await ensureMembership(conn, workspaceId, uid(m.email), m.role, `Member ${m.email}`);
    }
    for (const p of ws.projects) {
      const projectId = await ensureProject(conn, workspaceId, p, uid(p.createdBy));
      for (const t of p.tasks) {
        await ensureTask(conn, projectId, t, uid(t.createdBy), t.assignee ? uid(t.assignee) : null);
      }
    }
  }
}

// ---------------------------------------------------------------
// Post-seed verification (runs inside the transaction; failure rolls back)
// ---------------------------------------------------------------
async function verify(conn) {
  const slugs = demoWorkspaces.map((w) => w.slug);
  const checks = [
    [
      'workspace owners without an owner membership',
      `SELECT w.slug AS item FROM workspaces w
         LEFT JOIN workspace_members wm
           ON wm.workspace_id = w.id AND wm.user_id = w.owner_id AND wm.role = 'owner'
        WHERE w.slug IN (?) AND wm.user_id IS NULL`,
    ],
    [
      'projects whose creator is not an owner/admin of the workspace',
      `SELECT p.name AS item FROM projects p
         JOIN workspaces w ON w.id = p.workspace_id
         LEFT JOIN workspace_members wm
           ON wm.workspace_id = p.workspace_id AND wm.user_id = p.created_by AND wm.role IN ('owner','admin')
        WHERE w.slug IN (?) AND wm.user_id IS NULL`,
    ],
    [
      'tasks whose creator is not an owner/admin of the workspace',
      `SELECT t.title AS item FROM tasks t
         JOIN projects p ON p.id = t.project_id
         JOIN workspaces w ON w.id = p.workspace_id
         LEFT JOIN workspace_members wm
           ON wm.workspace_id = w.id AND wm.user_id = t.created_by AND wm.role IN ('owner','admin')
        WHERE w.slug IN (?) AND wm.user_id IS NULL`,
    ],
    [
      'tasks assigned to a user who is not a member of the task workspace',
      `SELECT t.title AS item FROM tasks t
         JOIN projects p ON p.id = t.project_id
         JOIN workspaces w ON w.id = p.workspace_id
         LEFT JOIN workspace_members wm
           ON wm.workspace_id = w.id AND wm.user_id = t.assignee_id
        WHERE w.slug IN (?) AND t.assignee_id IS NOT NULL AND wm.user_id IS NULL`,
    ],
    [
      'duplicate project names within a workspace',
      `SELECT p.name AS item FROM projects p JOIN workspaces w ON w.id = p.workspace_id
        WHERE w.slug IN (?) GROUP BY p.workspace_id, p.name HAVING COUNT(*) > 1`,
    ],
    [
      'duplicate task titles within a project',
      `SELECT t.title AS item FROM tasks t
         JOIN projects p ON p.id = t.project_id JOIN workspaces w ON w.id = p.workspace_id
        WHERE w.slug IN (?) GROUP BY t.project_id, t.title HAVING COUNT(*) > 1`,
    ],
  ];

  const failures = [];
  for (const [label, sql] of checks) {
    const [rows] = await conn.query(sql, [slugs]);
    if (rows.length) failures.push(`${label}: ${rows.map((r) => r.item).join(', ')}`);
  }
  if (failures.length) {
    throw new Error(`Post-seed verification failed:\n - ${failures.join('\n - ')}`);
  }
}

// ---------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------
async function main() {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    throw new Error('Set DB_HOST, DB_USER and DB_NAME (and DB_PASSWORD if needed) before seeding.');
  }
  if (!LOCAL_HOSTS.has(DB_HOST.toLowerCase())) {
    throw new Error(`Refusing to seed: DB_HOST "${DB_HOST}" is not localhost/127.0.0.1/::1.`);
  }

  validateDataset();

  const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: Number(DB_PORT) || 3306,
    connectionLimit: 2,
  });

  let conn;
  try {
    conn = await pool.getConnection();
    console.log(`Seeding database "${DB_NAME}" on ${DB_HOST}${REFRESH_DATES ? ' (refreshing due dates)' : ''}`);

    await preflight(conn);
    await conn.beginTransaction();
    await seed(conn);
    await verify(conn);
    await conn.commit();

    for (const [name, s] of Object.entries(stats)) {
      console.log(`${name.padEnd(12)} created: ${s.created}, reused: ${s.reused}`);
    }
    console.log('Demo data seeding finished.');
  } catch (err) {
    if (conn) await conn.rollback().catch(() => {});
    throw err;
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(`Demo seed failed${err.code ? ` [${err.code}]` : ''}: ${err.message}`);
  process.exitCode = 1;
});