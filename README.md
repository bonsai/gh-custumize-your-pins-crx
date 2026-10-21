# GitHub Profile Pins Customizer (CRX + CLI)

A client-side helper for planning GitHub profile pinned repositories.

> **Important limitation:** GitHub's official API exposes pinned items for reading, but does not provide a supported public mutation for changing profile pins. This project ranks and previews candidates; use GitHub's profile UI to apply the final selection.

## Components

- **Chrome Extension (Manifest V3):** adds a small planner to GitHub profile pages and reads the pinned repository cards already rendered by GitHub.
- **CLI:** fetches public repositories with GitHub REST API, ranks them, and exports a proposed set as JSON.
- **Shared scoring module:** one ranking rule set used by the CLI and extension.

## Quick start

### Chrome extension

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked** and choose the repository directory.
4. Open your GitHub profile, e.g. `https://github.com/bonsai`.

The extension only reads the current profile page and adds a local planning panel. It does not submit changes to GitHub.

### CLI

Requires Node.js 20 or newer.

```sh
node cli/pins.mjs list bonsai
node cli/pins.mjs rank bonsai --limit 6
node cli/pins.mjs export bonsai --limit 6 --out pins-plan.json
```

Optional authentication: set `GITHUB_TOKEN` to increase REST API rate limits. Do not commit tokens or put them in extension source code.

## Ranking

The initial score is intentionally transparent and deterministic:

- stars: logarithmic weight to avoid domination by very large repositories
- recent activity: freshness bonus
- repository metadata: excludes forks and archived repositories by default
- manual override: use `--limit` to control the number of suggestions

This is a planning aid, not an automated judgment of project quality. Review the resulting list before changing pins.

## Data and privacy

- No backend or telemetry.
- The extension does not require access to private repositories.
- The CLI writes only when `export` is requested.
- GitHub API data is public repository metadata unless you explicitly configure a token.

## Official references

- [Pinning items to your profile](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/pinning-items-to-your-profile)
- [GraphQL Users reference](https://docs.github.com/en/graphql/reference/users)
- [REST API: Users](https://docs.github.com/en/rest/users)

## Development

```sh
node --test
```

MIT
