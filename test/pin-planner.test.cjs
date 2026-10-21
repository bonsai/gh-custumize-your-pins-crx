const test = require("node:test");
const assert = require("node:assert/strict");
const { rank, score } = require("../shared/pin-planner.cjs");

test("rank excludes forks and archived repositories by default", () => {
  const repos = [
    { name: "active", stargazers_count: 4, pushed_at: "2026-10-20T00:00:00Z" },
    { name: "fork", fork: true, stargazers_count: 999 },
    { name: "archived", archived: true, stargazers_count: 999 }
  ];
  assert.deepEqual(rank(repos, { now: Date.parse("2026-10-21T00:00:00Z") }).map((r) => r.name), ["active"]);
});

test("rank is deterministic and respects limit", () => {
  const repos = [
    { name: "b", stargazers_count: 2, updated_at: "2026-10-20T00:00:00Z" },
    { name: "a", stargazers_count: 2, updated_at: "2026-10-20T00:00:00Z" },
    { name: "c", stargazers_count: 1, updated_at: "2026-10-20T00:00:00Z" }
  ];
  assert.deepEqual(rank(repos, { now: Date.parse("2026-10-21T00:00:00Z"), limit: 2 }).map((r) => r.name), ["a", "b"]);
});

test("score is a finite number", () => {
  assert.equal(Number.isFinite(score({ name: "example", stargazers_count: 10 }, Date.now())), true);
});
