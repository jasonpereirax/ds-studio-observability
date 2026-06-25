# PRD: DS Studio Observability Platform Evolution

## 1. Summary

DS Studio Observability is evolving from a runtime connection dashboard into a Design System intelligence platform.

The platform should help design, product, and engineering teams understand where the Design System is used, where instrumentation is weak, which components carry change risk, and what should be improved first.

AI Assistant remains out of scope for this phase. It should only be revisited after the data layer, governance layer, and decision layer are reliable.

## 2. Problem

Teams usually lack trustworthy answers to practical Design System questions:

- Which projects are connected?
- Which pages are mapped?
- Which pages are actually using DS components?
- Which components are official vs unknown?
- Which component changes would affect the most products/pages?
- Which pages have the highest design/instrumentation debt?
- Which issues should a team fix first?

Without runtime observability, teams rely on manual audits, outdated documentation, or scattered engineering knowledge.

## 3. Goals

- Provide a trustworthy current-state view of DS usage across connected projects.
- Separate historical events from the current operational state.
- Detect component inventory per project/page.
- Identify active findings without duplicating noise on every heartbeat.
- Score project health in a way teams can understand and challenge.
- Support registry governance by showing official and unknown components.
- Make impact analysis useful for real change planning.
- Generate executive-ready reports from live observability data.

## 4. Non Goals

- Build AI Assistant in this phase.
- Replace full product analytics tools.
- Provide session replay or user behavior analytics.
- Provide full multi-user authentication/admin workflows.
- Automatically rewrite product code.
- Integrate with Figma in this phase.

## 5. Users

### Design System Lead

Needs to understand adoption, coverage, drift, and governance gaps across products.

### Product Designer

Needs to identify pages with low DS coverage and understand where component usage differs from the intended system.

### Frontend Engineer

Needs to know which pages/components are affected before changing a component or token.

### Design Ops

Needs reports, health signals, and prioritization to support system adoption.

### Tech Lead / Product Manager

Needs a reliable view of risk, adoption, and improvement priorities.

## 6. Jobs To Be Done

- When I open the dashboard, I want to know which projects are connected and healthy so I can trust the data.
- When I inspect a project, I want to know which pages are using DS components so I can understand adoption.
- When I see a low score, I want to know why so I can act on it.
- When a component will change, I want to know which projects and pages are impacted.
- When components appear in production but not in the registry, I want to identify governance drift.
- When I report status to stakeholders, I want an executive summary with priorities and impact.

## 7. Current Implemented Baseline

The platform now includes:

- Runtime tracker script.
- Connected project detection.
- Page metadata capture.
- Page structure counts.
- Component usage capture via `data-ds-component`.
- Current page state via `observability_pages`.
- Current component inventory via `observability_component_inventory`.
- Active deduplicated findings via `observability_findings`.
- Component registry.
- Registry coverage and unknown component detection.
- Impact analysis with severity filters.
- Design debt/finding filters.
- Adoption, readiness, debt health, impact, and confidence scores.
- Score explanations per project.
- Reports with priorities and top impact components.
- SPA route tracking.
- `publicKey` required on collection.

## 8. Product Requirements

### 8.1 Data Trust

The platform must distinguish between:

- raw historical events;
- current page state;
- current component inventory;
- active findings;
- derived scores.

Requirements:

- Store every heartbeat as historical page event.
- Upsert current page state by `system_id`, `path`, and `environment`.
- Refresh component inventory for a page on each successful collection.
- Mark previous findings for a page inactive before writing current active findings.
- Preserve compatibility with older event-only data.
- Expose confidence score so users can understand data quality.

### 8.2 Collection Security

Requirements:

- `publicKey` is required for `/api/collect`.
- If a system already has a public key, future events must match it.
- Optional allowlist can be configured via `OBSERVABILITY_PUBLIC_KEYS`.
- Collection should fail clearly when key validation fails.
- CORS remains open enough for external tracked sites, but payload acceptance is controlled by key validation.

Future considerations:

- Rotate public keys per project.
- Add project-level allowed origins.
- Add rate limiting.

### 8.3 Runtime Tracker

Requirements:

- Capture page title, metadata, canonical URL, language, viewport, device type, structure counts, performance timing, and DS component usage.
- Capture DS components using `data-ds-component`.
- Support `data-ds-version`, `data-ds-variant`, and `data-ds-token`.
- Support SPAs by listening to route changes.
- Avoid sending duplicate heartbeats in a very short window.
- Expose `window.__DS_STUDIO_CONNECT__.ping()` for manual collection.

Future considerations:

- MutationObserver mode for delayed component rendering.
- Configurable selectors for non-standard DS markers.
- Project-level sampling.

### 8.4 Scores

The platform should produce scores that are useful, explainable, and conservative.

Scores:

- Adoption Score: combined project health signal.
- Readiness Score: DS coverage/readiness signal.
- Debt Health Score: inverse of active findings severity.
- Impact Score: surface area of component usage.
- Confidence Score: quality/completeness of collected signals.

Requirements:

- Display scores in Overview and Project Detail.
- Show score reasons in Project Detail.
- Avoid presenting score as absolute truth; it is a prioritization signal.

### 8.5 Registry Governance

Requirements:

- Show official registry components.
- Compare registry against runtime detected components.
- Show registry coverage.
- Show unknown components detected in production.
- Include registry metadata fields: category, status, maturity, owner, version, description.

Future considerations:

- In-app registry CRUD.
- Owner assignment.
- Component maturity workflow.
- Unknown component triage.
- Version drift detection.

### 8.6 Impact Analysis

Requirements:

- Show component usage count.
- Show impacted pages and systems.
- Flag impact level as low, medium, or high.
- Support filtering by impact level.
- Include critical journey signal when pages belong to Checkout or Authentication.

Future considerations:

- Component detail pages.
- Impact by token.
- Impact by version.
- Impact export.
- Critical journey configuration.

### 8.7 Findings And Design Debt

Requirements:

- Findings must represent active current issues, not endless event duplicates.
- Supported initial finding types:
  - `no_ds_components`
  - `untracked_buttons`
  - `untracked_forms`
- Findings include severity, title, description, value, project, page path, environment, and active state.
- UI supports filtering by severity.

Future considerations:

- Finding assignment.
- Resolution workflow.
- Snooze/ignore finding.
- Severity tuning per journey.
- Historical finding trend.

### 8.8 Reports

Requirements:

- Show connected projects, mapped pages, component usage, active findings, and average adoption score.
- Show lowest-health projects as priorities.
- Show highest-impact components.
- Provide JSON representation for easy copying/exporting.

Future considerations:

- CSV export.
- PDF export.
- Scheduled report generation.
- Report by project, environment, or date range.

## 9. UX Principles

- Operational, not decorative.
- Dense enough for repeated use.
- Scores must be accompanied by reasons.
- Empty states should explain the missing data signal.
- Filters should help narrow action, not create complexity.
- AI should stay visibly deferred until data trust is stronger.

## 10. Success Metrics

- Number of connected projects.
- Number of mapped pages.
- Percentage of pages with medium/high readiness.
- Number of DS components detected.
- Number of unknown components detected.
- Reduction of active high severity findings.
- Average adoption score over time.
- Number of reports generated/copied.
- Time to answer: "what is impacted if this component changes?"

## 11. Rollout Plan

### Phase 1: Platform Trust

Status: implemented baseline.

- Current page state.
- Component inventory.
- Active findings.
- Key validation.
- SPA route tracking.
- Score explanations.

### Phase 2: Governance

- Registry CRUD.
- Component owner and maturity workflows.
- Unknown component triage.
- Version drift detection.
- Project ownership metadata.

### Phase 3: Decision Layer

- Component detail pages.
- Page detail pages.
- Findings resolution workflow.
- Critical journey configuration.
- Better report exports.

### Phase 4: Collaboration

- Assign findings.
- Comment on findings.
- Track resolution status.
- Snapshot comparisons.
- Weekly health summaries.

### Phase 5: AI Assistant

Out of scope for now.

Candidate capabilities later:

- Explain project health.
- Recommend adoption plan.
- Summarize changes since last report.
- Prioritize findings.
- Answer impact questions in natural language.

## 12. Open Questions

- Should registry editing live in this module or in the main DS Studio product?
- What is the ownership model for projects?
- Should `publicKey` be generated inside the app?
- Should allowed origins be enforced per project?
- Which journeys are critical by default beyond Checkout and Authentication?
- How should findings be resolved or ignored?
- Which report format matters first: CSV or PDF?
- Should scores be customizable per organization?

## 13. Risks

- Scores may be over-trusted if data coverage is weak.
- Unknown component detection may create noise without a triage workflow.
- Manual `data-ds-component` adoption may be slow.
- Public collection endpoints need stronger rate limiting before broader usage.
- Reports may become too generic unless filtered by project/journey/environment.

## 14. Next Recommended Work

1. Add project settings for public key and allowed origins.
2. Add registry management UI.
3. Add component detail page.
4. Add finding detail and resolution workflow.
5. Add CSV export for reports.
6. Add critical journey configuration.
7. Add trend views for readiness and findings.
