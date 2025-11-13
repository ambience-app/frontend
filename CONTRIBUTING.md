# Contributing to Ambience Frontend

Thanks for your interest in contributing! This guide helps you set up the project, follow our style, and ship quality PRs.

## Development setup

- Requirements
  - Node.js 20+
  - npm (or pnpm/yarn)
- Clone and install
  - Fork this repo and clone your fork
  - Install deps: `npm install`
- Environment
  - Copy `.env.example` to `.env.local` and fill in:
    - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=`
    - `NEXT_PUBLIC_NETWORK=mainnet` (or `testnet`)
    - `NEXT_PUBLIC_CONTRACT_ADDRESS=`
    - `NEXT_PUBLIC_BASE_RPC_URL=`
    - `NEXT_PUBLIC_GRAPH_API_URL=`
- Run
  - Dev server: `npm run dev`
  - Storybook: `npm run storybook`
  - Lint: `npm run lint`
  - Build: `npm run build`

## Code style guidelines

- TypeScript strict mode is enabled — fix all type errors.
- Use the path alias `@/*` for imports from `src/*`.
- Tailwind CSS v4 is used for styling; prefer utility classes and avoid inline styles.
- Keep providers, hooks, and components small and composable.
- Follow existing patterns for wallet/auth (Reown AppKit + Wagmi).

## PR process

1. Fork the repo and create a feature branch from the latest default branch.
2. Keep changes focused and small; include context in the PR description.
3. Ensure the following before opening a PR:
   - `npm run lint` passes
   - App builds: `npm run build`
   - Storybook runs locally if you touched UI components: `npm run storybook`
   - Tests pass (see Testing section)
4. Open a PR from your fork/branch to this repo. Link related issues (e.g., `Fixes #123`).
5. Address review feedback; squash or tidy commits if requested.

## Testing requirements

- Unit/story tests use Vitest + Storybook test runner (Playwright provider).
- Commands:
  - Run Storybook tests via Vitest: `npm run test` (or `vitest` if configured locally)
  - Build Storybook: `npm run build-storybook`
- If you add or change UI components, consider adding/adjusting a Storybook story.

## Commit message conventions

- Use Conventional Commits to keep history readable and enable automation:
  - `feat: add wallet dropdown copy-to-clipboard`
  - `fix: correct basescan link on testnet`
  - `docs: add contributing guide`
  - `chore: update eslint config`
  - `refactor: simplify wallet icon sanitization`
  - `test: add vitest story checks`

## Security and sensitive data

- Never commit real secrets. `.env.example` exists for documentation only.
- Do not hardcode API keys; use `NEXT_PUBLIC_*` vars only when safe for client exposure.

## Community conduct

- Be respectful and constructive. This project follows the Contributor Covenant 2.1 (see `CODE_OF_CONDUCT.md`).
