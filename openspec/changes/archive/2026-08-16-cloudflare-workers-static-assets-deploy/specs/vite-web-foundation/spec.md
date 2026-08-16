## MODIFIED Requirements

### Requirement: Static Build Output

The build process SHALL produce a purely static set of files that MUST be hostable as static
assets on Cloudflare (e.g. Cloudflare Workers static assets), rather than requiring the
Cloudflare Pages product specifically.

#### Scenario: Production Build

- **WHEN** `bun run build` is executed in `apps/web`
- **THEN** a `dist` folder is created containing `index.html` and bundled assets
- **AND** the `dist` folder SHALL be serveable by a simple static file server (e.g., `bun x serve dist`)

#### Scenario: Cloudflare Static-Asset Hosting

- **WHEN** the `dist` folder is deployed to Cloudflare as static assets (e.g. via `wrangler deploy` with an `assets.directory` configuration)
- **THEN** the deployed site SHALL be publicly reachable and return a successful HTTP response for its root path
