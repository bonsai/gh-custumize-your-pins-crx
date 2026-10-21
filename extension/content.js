(() => {
  "use strict";

  if (!window.PinPlanner || document.getElementById("gh-pin-planner")) return;

  const pathParts = location.pathname.split("/").filter(Boolean);
  const login = pathParts[0];
  if (!login || ["settings", "organizations", "marketplace", "explore", "features", "topics", "collections", "sponsors"].includes(login)) return;
  if (pathParts.length > 1 && pathParts[1] !== "repositories") return;

  const currentPins = Array.from(document.querySelectorAll("#pinned-items .pinned-item-list-item, .pinned-item-list-item"))
    .map((card) => {
      const link = card.querySelector('a[data-hovercard-type="repository"], a[href*="/"]');
      const href = link && link.getAttribute("href");
      const match = href && href.match(/^\/([^/]+)\/([^/]+)$/);
      return match ? { full_name: match[1] + "/" + match[2], name: match[2], url: "https://github.com" + href } : null;
    })
    .filter(Boolean);

  const panel = document.createElement("aside");
  panel.id = "gh-pin-planner";
  panel.innerHTML = `
    <div class="ghpp-head">
      <strong>Profile Pins Planner</strong>
      <button type="button" class="ghpp-close" aria-label="Close planner">×</button>
    </div>
    <p class="ghpp-note">Plan up to six pins. Changes must be applied in GitHub's profile UI.</p>
    <div class="ghpp-current"><strong>Detected pins</strong><span class="ghpp-count">Checking…</span></div>
    <ul class="ghpp-list ghpp-current-list"></ul>
    <div class="ghpp-suggested"><strong>Suggested public repositories</strong></div>
    <div class="ghpp-status" role="status">Loading public repository metadata…</div>
    <ul class="ghpp-list ghpp-suggested-list"></ul>
    <button type="button" class="ghpp-copy">Copy suggested names</button>
    <a class="ghpp-profile-link" href="https://github.com/settings/profile">Open profile settings</a>
  `;
  document.body.appendChild(panel);

  const currentList = panel.querySelector(".ghpp-current-list");
  const suggestedList = panel.querySelector(".ghpp-suggested-list");
  const status = panel.querySelector(".ghpp-status");
  panel.querySelector(".ghpp-count").textContent = currentPins.length + " detected";
  currentPins.forEach((repo) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = repo.url;
    a.textContent = repo.full_name;
    a.target = "_blank";
    a.rel = "noreferrer";
    li.appendChild(a);
    currentList.appendChild(li);
  });
  if (!currentPins.length) {
    const li = document.createElement("li");
    li.textContent = "No pinned repository cards detected on this page.";
    currentList.appendChild(li);
  }

  panel.querySelector(".ghpp-close").addEventListener("click", () => panel.remove());
  panel.querySelector(".ghpp-copy").addEventListener("click", async () => {
    const names = Array.from(suggestedList.querySelectorAll("a")).map((a) => a.dataset.fullName);
    try {
      await navigator.clipboard.writeText(names.join("\n"));
      status.textContent = "Copied " + names.length + " suggested repository names.";
    } catch {
      status.textContent = "Clipboard unavailable. Select and copy the list manually.";
    }
  });

  async function fetchAllPublicRepos(user) {
    const all = [];
    for (let page = 1; page <= 10; page += 1) {
      const response = await fetch("https://api.github.com/users/" + encodeURIComponent(user) + "/repos?per_page=100&page=" + page + "&sort=updated&type=owner", {
        headers: { Accept: "application/vnd.github+json" }
      });
      if (!response.ok) throw new Error("GitHub API returned HTTP " + response.status);
      const batch = await response.json();
      all.push(...batch);
      if (batch.length < 100) break;
    }
    return all;
  }

  fetchAllPublicRepos(login)
    .then((repos) => {
      const suggestions = window.PinPlanner.rank(repos, { limit: 6 });
      suggestedList.replaceChildren();
      suggestions.forEach((repo) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = repo.html_url;
        a.textContent = repo.full_name;
        a.dataset.fullName = repo.full_name;
        a.target = "_blank";
        a.rel = "noreferrer";
        const meta = document.createElement("span");
        meta.textContent = " ★ " + (repo.stargazers_count || 0) + " · score " + repo.pinPlannerScore;
        li.append(a, meta);
        suggestedList.appendChild(li);
      });
      status.textContent = suggestions.length ? "Ranked " + suggestions.length + " public repositories from " + repos.length + " fetched. Review before using." : "No eligible repositories found.";
    })
    .catch((error) => {
      status.textContent = "Could not load suggestions: " + error.message + ". The planner does not change pins automatically.";
    });
})();