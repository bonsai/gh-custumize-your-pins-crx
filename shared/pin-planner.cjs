(function (root) {
  "use strict";

  function score(repo, now) {
    const stars = Math.max(0, Number(repo.stargazers_count) || 0);
    const updated = Date.parse(repo.pushed_at || repo.updated_at || "");
    const ageDays = Number.isFinite(updated) ? Math.max(0, (now - updated) / 86400000) : 3650;
    const freshness = Math.max(0, 30 - Math.min(30, ageDays / 6));
    const descriptionBonus = repo.description ? 2 : 0;
    return Math.round((Math.log2(stars + 1) * 3 + freshness + descriptionBonus) * 100) / 100;
  }

  function rank(repos, options) {
    const opts = options || {};
    const now = Number.isFinite(opts.now) ? opts.now : Date.now();
    const includeForks = opts.includeForks === true;
    const includeArchived = opts.includeArchived === true;
    const limit = Number.isInteger(opts.limit) && opts.limit > 0 ? opts.limit : 6;

    return (repos || [])
      .filter((repo) => repo && repo.name && (includeForks || !repo.fork) && (includeArchived || !repo.archived))
      .map((repo) => Object.assign({}, repo, { pinPlannerScore: score(repo, now) }))
      .sort((a, b) => b.pinPlannerScore - a.pinPlannerScore || String(a.name).localeCompare(String(b.name)))
      .slice(0, limit);
  }

  const api = { score, rank };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.PinPlanner = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
