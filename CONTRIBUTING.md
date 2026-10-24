# Contributing to BuddyAI

Thank you for your interest in contributing to BuddyAI. Contributions of code,
documentation, testing, design, translations, protocol research, and feedback
are welcome.

BuddyAI is an open-source training and decision-support tool for PPE donning
and doffing. It is not a medical device and does not replace a trained
observer, a facility protocol, or CDC/WHO guidance. Contributions that affect
clinical workflows must preserve that distinction.

## Project status

BuddyAI is an active prototype built for MLH Hacktoberfest Hack Day Nairobi.
The current application includes:

- A React 18 progressive web app with English and Kiswahili interfaces.
- Live Coach, Training, Session Summary, Supervisor Dashboard, Inventory, and
  Settings screens.
- An Express 5 API with JWT authentication, role-aware routes, Socket.IO
  feedback, and in-memory frame processing.
- CDC-sourced donning and doffing protocols, with source URLs stored alongside
  protocol steps.
- Gemma provider support through the Gemini API and Ollama, plus a deterministic
  mock provider for local development and tests.
- Session risk scoring, coaching summaries, inventory tracking, QR labels, and
  optional Africa's Talking SMS alerts.
- MongoDB persistence when `MONGO_URI` is configured, with an
  `mongodb-memory-server` fallback for zero-setup development.
- Automated server and client tests run with Vitest.

The repository is still evolving. Interfaces, API contracts, prompts, data
models, and clinical workflows may change between releases.

## Ways to contribute

### Code

- Fix bugs or improve existing user flows.
- Add focused unit or API tests for changed behavior.
- Improve camera, frame-diff, Socket.IO, or offline behavior.
- Improve accessibility, responsive layouts, and tablet usability.
- Improve error states, loading states, and localization coverage.
- Improve provider reliability, timeout handling, and observability.
- Add integrations only when they preserve privacy and work with the existing
  provider abstraction.

### Protocols and domain research

- Add a protocol variant for a different facility or jurisdiction.
- Improve protocol wording or step metadata.
- Add a source URL for every clinical step.
- Review protocol changes with an appropriate infection-prevention or clinical
  expert before presenting them as production-ready.

Do not invent clinical steps, imply clinical validation that has not happened,
or remove safety disclaimers without maintainer approval.

### Documentation, translation, and design

- Improve setup and deployment documentation.
- Add or improve translations, including Luganda, French, or Lingala.
- Improve keyboard navigation, screen-reader support, contrast, and text sizing.
- Provide screenshots, reproducible bug reports, or usability feedback from
  tablet-sized devices.

### Testing and validation

- Add regression tests for API, authentication, risk scoring, Gemma response
  parsing, and core UI behavior.
- Test mock, Gemini, and Ollama provider paths where the required service is
  available.
- Measure live-check latency using the benchmark script and include the
  environment and model in performance reports.
- Test deployments with Docker Compose and the production build path.

## Before you start

1. Check the existing issues and pull requests for related work.
2. For a substantial change, open an issue first so the scope and design can be
   discussed.
3. Keep pull requests focused. Separate refactors, feature work, and formatting
   changes when possible.
4. Never commit credentials, API keys, personal data, camera frames, or local
   `.env` files.

Good first contributions include accessibility fixes, test coverage, clearer
error handling, translation improvements, protocol-source documentation, and
small UI fixes.

## Local development

### Prerequisites

- Node.js 20 or a compatible current LTS release.
- npm.
- Docker Desktop, if you want to use the containerized stack.
- A Gemini API key for hosted Gemma checks, or Ollama with a compatible Gemma
  model. Neither is required when using the mock provider.

### Install dependencies

From the repository root:

```bash
npm install
```

Copy the server environment template if you need custom settings:

```bash
cp server/.env.example server/.env
```

On Windows PowerShell, use:

```powershell
Copy-Item server/.env.example server/.env
```

Keep `server/.env` local. It is intentionally not part of the repository.

### Run without external AI services

The mock provider is deterministic and is the preferred mode for UI work,
tests, and contributions that do not change model behavior:

```bash
# Unix-like shells
GEMMA_PROVIDER=mock npm run dev
```

```powershell
# Windows PowerShell
$env:GEMMA_PROVIDER = "mock"
npm run dev
```

The client runs at <http://localhost:5173> and the API runs at
<http://localhost:4000>. The Vite development server proxies `/api` and
`/socket.io` to the API.

Demo accounts use the password `buddy-demo-2026`:

- `worker@buddy.ai`
- `supervisor@buddy.ai`

### Run with Docker Compose

```bash
docker compose up --build
```

The containerized app is available at <http://localhost:8080>. The Compose
configuration starts MongoDB, the server, and the client.

### Run with Gemini or Ollama

For Gemini, set `GEMMA_PROVIDER=gemini` and provide `GEMINI_API_KEY`.

For Ollama, start Ollama, install a compatible model, and set:

```bash
ollama pull gemma4
GEMMA_PROVIDER=ollama OLLAMA_HOST=http://localhost:11434 OLLAMA_MODEL=gemma4 npm run dev
```

Do not include API keys or other secrets in issue reports, pull requests, test
fixtures, screenshots, or logs.

## Tests and validation

Run the full test suite before submitting a pull request:

```bash
npm test
```

Run a production client build when changing client bundling, routing, or
deployment behavior:

```bash
npm run build
```

When changing only one workspace, focused commands are also available:

```bash
npm test -w server
npm test -w client
npm run build -w client
```

For live-check performance work, use the existing benchmark script and record
the model, provider, image, number of runs, and machine details:

```bash
node server/scripts/bench.js --img docs/test-images/ppe-check.jpg --model gemma-4-26b-a4b-it --prompt compact --thinking minimal --max 320 --runs 5
```

If a test or service cannot be run locally, explain that clearly in the pull
request instead of presenting an unverified result.

## Development guidelines

- Follow the existing JavaScript, JSX, and JSON style in the surrounding file.
- Prefer small, typed-by-convention changes that reuse existing helpers and
  provider abstractions.
- Preserve existing API response shapes unless the change includes a clear
  migration plan and updated tests.
- Validate input at API boundaries and surface actionable errors.
- Keep camera frames in memory; do not add persistence for raw frames without a
  reviewed privacy design.
- Keep model output schema-validated and deterministic in mock mode.
- Update related tests and documentation with behavior changes.
- Keep user-facing text in the i18n string tables rather than embedding new
  untranslated copy in components.
- Avoid unrelated formatting or dependency changes in feature pull requests.

## Branches, commits, and pull requests

Create a branch from the current `main` branch:

```bash
git switch main
git pull --ff-only origin main
git switch -c fix/short-description
```

Use a descriptive branch name, for example:

- `fix/session-summary-refresh`
- `feat/protocol-variant`
- `docs/local-development`
- `test/risk-scoring`

Use concise commit messages that describe the change. Conventional prefixes
such as `feat:`, `fix:`, `docs:`, `test:`, and `chore:` are encouraged.

Pull requests should:

1. Explain the problem and the proposed solution.
2. Identify the user-facing or API behavior that changed.
3. Link the related issue, if one exists.
4. Include tests run and their results.
5. Include screenshots or a short recording for meaningful UI changes.
6. Call out configuration, migration, privacy, performance, or protocol
   implications.
7. Keep secrets, real patient information, and unreviewed clinical claims out
   of the change.

Maintainers may request revisions, additional tests, or domain review before
merging. All contributors must follow the project's [Apache 2.0 license](./LICENSE).

## Current development priorities

The following work is currently planned or actively useful:

- On-device frame pre-filtering with YOLO or MediaPipe so Gemma receives only
  materially changed frames.
- Ollama with Gemma 4 e2b on a Raspberry Pi 5 for clinics with limited
  connectivity.
- Ministry of Health and county IPC dashboards, including DHIS2 export.
- Kenya Data Protection Act 2019 compliance review and a data protection impact
  assessment.
- Glove-hygiene step timers and audio-only operation.
- Broader language coverage, beginning with Luganda, French, and Lingala.
- More accessibility and tablet usability testing.
- Stronger regression coverage for provider fallbacks, offline behavior,
  sessions, roles, and risk scoring.

Roadmap items are proposals, not promises. Open an issue before beginning
substantial work so priorities, scope, and acceptance criteria can be agreed.

## Reporting bugs and security issues

### Bug reports

Use a GitHub issue and include:

- A concise title.
- Steps to reproduce.
- Expected and actual behavior.
- Browser, operating system, device, and Node.js version where relevant.
- Provider and model configuration, excluding secrets.
- Relevant logs, screenshots, or a minimal reproduction.

Do not attach real patient information or identifiable camera footage.

### Security issues

Do not disclose exploitable vulnerabilities in a public issue. Contact the
maintainers privately through the repository's GitHub security reporting
mechanism, when enabled, or request a private contact channel from a
maintainer. Include enough detail to reproduce the issue safely, but do not
include credentials or personal data.

## Questions and support

For questions about a proposed change, open a discussion or issue with the
context, alternatives considered, and the help you need. For urgent safety or
clinical concerns, defer to the responsible infection-prevention and control
lead rather than relying on this project or its issue tracker.

