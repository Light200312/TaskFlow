// backend_tasks/dummydata/demoDataset.js
// Static demo dataset for the TaskFlow seeder.
// - Users are referenced by email and must exist in dummyusers.js.
// - The workspace owner's 'owner' membership is added automatically by the seeder,
//   so `members` lists everyone else.
// - dueInDays is relative to the day the seeder runs (negative = past, null = no due date).
// - Creators (createdBy) must be the workspace owner or an admin.
// - Assignees must be members of the same workspace.

const ROSHAN = 'roshan@gmail.com';
const ARSLAN = 'arslan@gmail.com';
const ALICE = 'alice.demo@example.com';
const BOB = 'bob.demo@example.com';
const CHARLIE = 'charlie.demo@example.com';
const DIANA = 'diana.demo@example.com';
const EVAN = 'evan.demo@example.com';

export const demoWorkspaces = [
  // ---------------------------------------------------------------
  {
    name: 'Acme Product Team',
    slug: 'acme-product-team',
    owner: ALICE,
    members: [
      { email: ROSHAN, role: 'admin' },
      { email: BOB, role: 'member' },
      { email: CHARLIE, role: 'member' },
      { email: DIANA, role: 'viewer' },
    ],
    projects: [
      {
        name: 'Mobile App Redesign',
        description: 'Refresh the mobile app UI and fix top reported issues.',
        status: 'active',
        createdBy: ALICE,
        dueInDays: 21,
        tasks: [
          { title: 'Audit current mobile screens', description: 'List every screen and note usability problems.', status: 'done', priority: 'high', assignee: BOB, createdBy: ALICE, dueInDays: -12 },
          { title: 'Design new onboarding flow', description: 'Three-step onboarding with skip option.', status: 'in_progress', priority: 'high', assignee: CHARLIE, createdBy: ROSHAN, dueInDays: 4 },
          { title: 'Fix login screen crash on Android', description: 'Crash reported on Android 12 after rotating the device.', status: 'todo', priority: 'urgent', assignee: BOB, createdBy: ALICE, dueInDays: -2 },
          { title: 'Write release notes draft', description: null, status: 'todo', priority: 'low', assignee: null, createdBy: ROSHAN, dueInDays: 10 },
        ],
      },
      {
        name: 'Q4 Release Planning',
        description: 'Plan scope, capacity and schedule for the Q4 release.',
        status: 'planning',
        createdBy: ROSHAN,
        dueInDays: 45,
        tasks: [
          { title: 'Collect stakeholder feature requests', description: 'Gather requests from sales, support and design.', status: 'review', priority: 'medium', assignee: CHARLIE, createdBy: ROSHAN, dueInDays: 2 },
          { title: 'Draft Q4 roadmap', description: 'First version of the roadmap for team review.', status: 'in_progress', priority: 'high', assignee: ROSHAN, createdBy: ALICE, dueInDays: 7 },
          { title: 'Estimate engineering capacity', description: null, status: 'todo', priority: 'medium', assignee: null, createdBy: ALICE, dueInDays: 14 },
          { title: 'Schedule kickoff meeting', description: 'Book a room and send invites.', status: 'done', priority: 'low', assignee: ALICE, createdBy: ALICE, dueInDays: -3 },
        ],
      },
    ],
  },
  // ---------------------------------------------------------------
  {
    name: 'Northwind Marketing',
    slug: 'northwind-marketing',
    owner: ROSHAN,
    members: [
      { email: ARSLAN, role: 'admin' },
      { email: EVAN, role: 'member' },
      { email: ALICE, role: 'member' },
      { email: BOB, role: 'viewer' },
    ],
    projects: [
      {
        name: 'Autumn Campaign Launch',
        description: 'Multi-channel campaign for the autumn product launch.',
        status: 'active',
        createdBy: ROSHAN,
        dueInDays: 14,
        tasks: [
          { title: 'Finalize campaign messaging', description: 'Agree on headline, tagline and key claims.', status: 'done', priority: 'high', assignee: EVAN, createdBy: ROSHAN, dueInDays: -8 },
          { title: 'Design social media banners', description: 'Banners for Instagram, LinkedIn and X.', status: 'in_progress', priority: 'medium', assignee: ALICE, createdBy: ARSLAN, dueInDays: 3 },
          { title: 'Set up email newsletter schedule', description: 'Weekly sends for the four campaign weeks.', status: 'review', priority: 'medium', assignee: EVAN, createdBy: ROSHAN, dueInDays: -1 },
          { title: 'Book influencer partnerships', description: null, status: 'todo', priority: 'urgent', assignee: null, createdBy: ARSLAN, dueInDays: 6 },
        ],
      },
      {
        name: 'Website SEO Audit',
        description: 'Technical and content SEO review of the marketing site.',
        status: 'completed',
        createdBy: ARSLAN,
        dueInDays: -15,
        tasks: [
          { title: 'Crawl site and list broken links', description: null, status: 'done', priority: 'medium', assignee: EVAN, createdBy: ARSLAN, dueInDays: -30 },
          { title: 'Optimize page titles and meta tags', description: 'Cover the top 30 landing pages.', status: 'done', priority: 'high', assignee: ALICE, createdBy: ARSLAN, dueInDays: -24 },
          { title: 'Compile final SEO report', description: null, status: 'done', priority: 'medium', assignee: ARSLAN, createdBy: ROSHAN, dueInDays: -20 },
          { title: 'Present findings to leadership', description: null, status: 'done', priority: 'low', assignee: ROSHAN, createdBy: ROSHAN, dueInDays: -18 },
        ],
      },
    ],
  },
  // ---------------------------------------------------------------
  {
    name: 'Zenith Engineering Lab',
    slug: 'zenith-engineering-lab',
    owner: DIANA,
    members: [
      { email: CHARLIE, role: 'admin' },
      { email: EVAN, role: 'member' },
      { email: ROSHAN, role: 'member' },
      { email: ARSLAN, role: 'member' },
    ],
    projects: [
      {
        name: 'Sensor Calibration Toolkit',
        description: 'Tools and procedures for calibrating IMU and GPS sensors.',
        status: 'active',
        createdBy: DIANA,
        dueInDays: 30,
        tasks: [
          { title: 'Define calibration test procedure', description: 'Written steps and acceptance thresholds.', status: 'done', priority: 'high', assignee: ROSHAN, createdBy: DIANA, dueInDays: -15 },
          { title: 'Build GPS offset correction script', description: 'Apply per-device offsets to raw GPS readings.', status: 'in_progress', priority: 'high', assignee: ARSLAN, createdBy: DIANA, dueInDays: -4 },
          { title: 'Collect baseline IMU readings', description: 'Ten minutes of stationary data per device.', status: 'todo', priority: 'medium', assignee: EVAN, createdBy: CHARLIE, dueInDays: 9 },
          { title: 'Order replacement sensor modules', description: null, status: 'todo', priority: 'urgent', assignee: null, createdBy: CHARLIE, dueInDays: 1 },
        ],
      },
      {
        name: 'Legacy Data Migration',
        description: 'Move old lab CSV archives into the new database.',
        status: 'on_hold',
        createdBy: CHARLIE,
        dueInDays: 60,
        tasks: [
          { title: 'Inventory legacy CSV archives', description: null, status: 'done', priority: 'low', assignee: EVAN, createdBy: CHARLIE, dueInDays: -21 },
          { title: 'Map old fields to new schema', description: 'Spreadsheet mapping old column names to new ones.', status: 'in_progress', priority: 'medium', assignee: ARSLAN, createdBy: CHARLIE, dueInDays: 5 },
          { title: 'Validate sample migration run', description: 'Migrate one month of data and compare totals.', status: 'todo', priority: 'high', assignee: ROSHAN, createdBy: DIANA, dueInDays: 12 },
          { title: 'Decide on archive retention policy', description: null, status: 'todo', priority: 'medium', assignee: null, createdBy: DIANA, dueInDays: null },
        ],
      },
    ],
  },
];