#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { rank } from "../shared/pin-planner.cjs";

function usage() {
  console.log(`GitHub Profile Pins Planner

Usage:
  node cli/pins.mjs list <owner>
  node cli/pins.mjs rank <owner> [--limit 6]
  node cli/pins.mjs export <owner> [--limit 6] [--out pins-plan.json]
  node cli/pins.mjs rank --input repos.json [--limit 6]

Set GITHUB_TOKEN to increase the GitHub REST API rate limit.
`);
}

function option(args, name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

async function getRepos(owner) {
  const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = "Bearer " + process.env.GITHUB_TOKEN;
  const all = [];
  for (let page = 1; page <= 10; page += 1) {
    const url = "https://api.github.com/users/" + encodeURIComponent(owner) + "/repos?per_page=100&page=" + page + "&sort=updated&type=owner";
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error("GitHub API returned HTTP " + response.status + ": " + await response.text());
    const batch = await response.json();
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

function display(repos) {
  for (const [index, repo] of repos.entries()) {
    console.log(String(index + 1).padStart(2, " ") + ". " + repo.full_name + " | ★ " + (repo.stargazers_count || 0) + " | score " + repo.pinPlannerScore + " | " + (repo.html_url || ""));
  }
}

async function main() {
  const [command, first, ...args] = process.argv.slice(2);
  if (!command || command === "help" || command === "--help") return usage();

  const input = option([first, ...args], "--input", null);
  const requestedLimit = Number(option(args, "--limit", "6")) || 6;
  const limit = Math.max(1, Math.min(6, requestedLimit));
  const owner = first;
  let repos;

  if (input) {
    repos = JSON.parse(await readFile(input, "utf8"));
    if (!Array.isArray(repos)) throw new Error("--input must point to a JSON array of repository objects.");
  } else {
    if (!owner || owner.startsWith("--")) throw new Error("Provide a GitHub owner name.");
    repos = await getRepos(owner);
  }

  if (command === "list") return display(repos.map((repo) => ({ ...repo, pinPlannerScore: "—" })));
  if (command !== "rank" && command !== "export") throw new Error("Unknown command: " + command);

  const suggestions = rank(repos, { limit });
  if (command === "rank") return display(suggestions);

  const out = option(args, "--out", "pins-plan.json");
  const plan = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    owner: owner && !owner.startsWith("--") ? owner : null,
    limit,
    note: "Proposal only. Apply pinned repository changes manually in GitHub profile settings.",
    repositories: suggestions.map((repo) => ({
      full_name: repo.full_name,
      url: repo.html_url,
      stars: repo.stargazers_count || 0,
      updated_at: repo.pushed_at || repo.updated_at || null,
      score: repo.pinPlannerScore
    }))
  };
  await writeFile(out, JSON.stringify(plan, null, 2) + "\n", "utf8");
  console.log("Wrote " + suggestions.length + " suggestions to " + out);
}

main().catch((error) => {
  console.error("Error: " + error.message);
  process.exitCode = 1;
});
