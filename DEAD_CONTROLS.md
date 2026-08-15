# Dead Controls — ApexCivil (LIVE `apex-civil.vercel.app`)

Every control below was clicked in the real live browser and observed to do **nothing** (no navigation, no state change, no network request). "Dead" = visible, styled like an interactive control, but with no functional handler.

| # | Control | Page | Looks like | Live behavior | Source evidence |
|---|---|---|---|---|---|
| DC-1 | **Edit Goal** (✎) | Dashboard | Button (indigo, pencil icon) | Nothing happens; stays on dashboard | `Dashboard.tsx`: `<button>` with no `onClick` (deployed HEAD) |
| DC-2 | **Set Target Date** | Dashboard | Button | Nothing happens | `Dashboard.tsx`: `<button>` no `onClick` |
| DC-3 | **View All Topics** | Dashboard | Button | Nothing happens | `Dashboard.tsx`: `<button>` no `onClick` |
| DC-4 | **View All →** | Dashboard (weak topics header) | Button | Nothing happens | `Dashboard.tsx`: `<button>` no `onClick` |
| DC-5 | **Custom** time | Exam Setup | Active segment button | No-op; summary stays "15 Minutes" (never prompts/accepts a custom value) | `ExamSetup.tsx`: `onClick={() => typeof mins === 'number' && setTimeLimit(mins)}` — `'Custom'` is a string, condition false |
| DC-6 | **Back arrow** | Exam Setup (top-left) | Icon button | Nothing happens | `ExamSetup.tsx`: `<button>` with no `onClick` |
| DC-7 | **Reset Data** | Settings (Danger Zone) | Red destructive-style button | Nothing happens; no confirm dialog, no action | `SettingsView.tsx`: `<button>` no `onClick` (styled in danger colors) |
| DC-8 | **View Details →** | Performance row | Link-styled text (indigo, arrow) | Not clickable — it's a plain `<span>` | `PerformanceView.tsx`: `<span className="...indigo-500">View Details →</span>` — live DOM confirmed SPAN, zero buttons in Performance view |
| DC-9 | **Weak topic card** | Dashboard (weak topics card) | Hover-styled card | Not clickable — rendered as `<div>` | `Dashboard.tsx`: card is a div; only "View All →" sits above it |

## Notes

- DC-1..DC-4 are all in the **deployed** Dashboard. The repo's *working tree* has uncommitted changes that wire `onNavigate` for these four buttons (Edit Goal / View All Topics / View All →), but **they are not in the live deployment** — consistent with "local-only improvements" noted in the earlier baseline. Set Target Date has no wiring in either.
- DC-5/DC-6/DC-7 are dead in **both** the live deployment and the current working tree.
- DC-8/DC-9 are dead in the live deployment; working tree matches.

## Live reproduction (one line each)

```
Dashboard → click "Edit Goal"            → URL unchanged, view unchanged
Dashboard → click "View All Topics"      → URL unchanged, view unchanged
Exam Setup → click "Custom"              → summary still "15 Minutes"
Exam Setup → click back arrow            → URL unchanged, view unchanged
Settings → click "Reset Data"            → no dialog, no change
Performance → click "View Details →"     → element is a span; nothing happens
```

## Impact

- **UX:** 9 visible controls are non-functional. The most damaging are the four Dashboard CTAs (users repeatedly tap "Edit Goal" / "View All Topics" expecting navigation) and "Reset Data" (users may expect destructive behavior; it silently does nothing).
- **Data:** no DB impact — dead controls perform no operations.
- **Severity:** DC-1..DC-4 HIGH (core navigation CTAs on the primary landing view, and their wiring exists locally but never shipped); DC-5 MEDIUM (broken form control); DC-6 LOW; DC-7 HIGH (misleading danger-zone UI); DC-8 LOW; DC-9 LOW.
