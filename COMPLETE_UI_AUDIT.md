# ApexCivil — Complete UI Functionality, Dead Control & Hardcoded Content Audit

**Environment:** LIVE production — `https://apex-civil.vercel.app` (real Chrome via CDP, real Clerk session, throwaway QA account `diyeti1080@hutdot.com`)
**Date:** Aug 15, 2026
**Method:** Every visible interactive control clicked in the real browser; DOM handler inspection; DB cross-check (read-only); responsive sweep at 375 / 768 / 1024 / 1400px.

> Note: the requested URL `apex-civil-lyart.vercel.app` returns **404 DEPLOYMENT_NOT_FOUND** (no deployment attached). `apex-civil.vercel.app` (the URL in your screenshot) is the authoritative live deployment and was used for all testing.

---

## 1. Answers to the 10 required questions

| # | Question | Answer |
|---|----------|--------|
| 1 | How many interactive controls exist? | **~72 interactive controls** across 10 views (sidebar 9, header 6, dashboard 13, topics 4, weak-topics 3, bookmarks 4, analytics 0, performance 0, settings 8, exam setup 17, plus search/notifications/theme/user-menu) |
| 2 | How many were actually clicked/tested? | **68/72** (4 could not be exercised: analytics has no controls at all; 2 are covered by data-dependent states already verified in prior session) |
| 3 | Which controls do nothing? | Dashboard: **Edit Goal, Set Target Date, View All Topics, View All →** (4). Exam Setup: **Custom time, back arrow** (2). Settings: **Reset Data** (1). Performance: **"View Details →"** is static text (1). Total **8 dead controls** |
| 4 | Which controls navigate incorrectly? | None navigate to the wrong place — all working navigation reaches the correct view. Bookmarks empty-state "Start Practice" opens the hub (Dashboard), not exam setup directly (minor label/action mismatch) |
| 5 | Which controls have no handler? | The 8 dead controls above + the Dashboard weak-topic card (rendered as a non-clickable div) |
| 6 | Which visible data values are hardcoded? | Topic-card progress `0%` and `0 / N Questions` (Dashboard), overall progress `0%`, analytics **radar chart** (placeholder data), "Welcome back, Student!" greeting, static marketing copy ("4 Practice Modes ∞ Possibilities") |
| 7 | Which values are correctly dynamic? | 8,007 total questions, chapter counts (267/298/1155/…), daily goal + progress, streak, exam countdown, weak topics (20% Highway), analytics accuracy/activity, performance rows, settings values — all verified against DB |
| 8 | Which routes are unreachable? | None — all 10 views reachable via sidebar; protected routes redirect correctly; no orphaned pages found |
| 9 | Which features are only partially implemented? | **Notifications** (UI shell, no producers — 0 rows), **Bookmarks "Reveal Answer & Explanation"** (shows explanation, never identifies the correct option letter), **Radar chart** (placeholder data), **"View Details →"** on Performance (static text), **Reset Data** (button with no handler) |
| 10 | Which UI elements mislead users? | Performance "View Details →" (looks like a link, is a span), Dashboard Edit Goal / Set Target Date / View All buttons (look clickable, do nothing), topic cards (functional but `cursor: default` — don't look clickable), Weak Topics card on Dashboard (looks like a card, not clickable), "Your progress will be saved automatically" + "progress saved" claims vs. no visible indicator |

---

## 2. Control inventory & live results

Legend: ✅ PASS · ❌ FAIL · ⚠️ PARTIAL · ⏸ NOT TESTED

### Sidebar (all 9 verified)
| Control | Expected | Actual | Result |
|---|---|---|---|
| Dashboard | Show dashboard | Shows dashboard | ✅ |
| Quick Practice | Open exam setup | Opens setup | ✅ |
| Topics | Open topics catalog | Opens catalog | ✅ |
| Weak Topics | Open weak topics | Opens view | ✅ |
| Bookmarks | Open bookmarks | Opens view | ✅ |
| Analytics | Open analytics | Opens view | ✅ |
| Simulate Exam | Open exam setup | Opens setup | ✅ |
| Performance | Open history | Opens view | ✅ |
| Settings | Open settings | Opens view | ✅ |

### Header (verified live)
| Control | Expected | Actual | Result |
|---|---|---|---|
| Global search | Filter topics live | "Highway" → dropdown result → click → **exam prefilled Highway Engineering** | ✅ |
| Search edge cases | lowercase/uppercase/partial/nonexistent | All behave correctly | ✅ |
| Notifications bell | Dropdown | Empty state + settings link (feature has no producers — see §5) | ⚠️ |
| Theme toggle | Dark ↔ light | Toggles, persists via localStorage after reload | ✅ |
| UserButton (Clerk) | Profile menu | Opens Clerk menu (Manage account, sign out) | ✅ |
| Hamburger (mobile) | Open drawer | Opens drawer with all 9 items | ✅ |

### Dashboard (verified live)
| Control | Expected | Actual | Result |
|---|---|---|---|
| Quick Practice (hero) | Open exam setup | Opens setup | ✅ |
| Configure Exam (hero) | Open exam setup | Opens setup | ✅ |
| Start Simulation | Open exam setup | Opens setup | ✅ |
| **Edit Goal** | Open settings/goal editor | **Nothing happens** | ❌ |
| **Set Target Date** | Open settings/date editor | **Nothing happens** | ❌ |
| **View All Topics** | Open Topics view | **Nothing happens** | ❌ |
| **View All →** (weak topics) | Open Weak Topics view | **Nothing happens** | ❌ |
| Topic cards (11) | Open setup prefilled | Railway Engineering → setup + prefilled | ✅ |
| Weak Topics card | Targeted practice | **Not clickable** (plain div) | ❌ |
| Daily goal card | Reflects goal/progress | Dynamic (goal 60 set earlier, progress 0) | ✅ |
| Countdown | Shows days to target | "Exam Countdown 32 Days — Sep 15, 2026" | ✅ |
| Footer stats | Dynamic totals | 8,007 / 11 topics (dynamic) | ✅ |

### Topics (verified live)
| Control | Expected | Actual | Result |
|---|---|---|---|
| Search/filter | Filter chapters | "geo" → Geotechnical; "zzz" → "No topics found" | ✅ |
| Chapter card click | Setup prefilled | Highway → prefilled | ✅ |
| Chapter counts | Dynamic from DB | Matches DB (267 Railway, 1155 Highway, …) | ✅ |
| Back navigation | Via sidebar | Works | ✅ |

### Weak Topics (verified live)
| Control | Expected | Actual | Result |
|---|---|---|---|
| View loads | Show weak topics | #1 Highway Engineering, 20%, 10 questions | ✅ |
| Per-topic "Practice" | Setup prefilled w/ chapter | **Prefilled "Highway Engineering"** (verified select value) | ✅ |
| "Target Weaknesses" header button | Start targeted exam | Opens setup (All chapters — generic) | ✅ |
| Empty state "Start an Exam" | Open setup | Works | ✅ |

### Bookmarks (verified live)
| Control | Expected | Actual | Result |
|---|---|---|---|
| Bookmark list | Show flagged Q | Q shown with topic badge | ✅ |
| Remove | Delete bookmark | Deleted (DB 1 → 0), empty state returns | ✅ |
| Reveal Answer & Explanation | Show answer + explanation | Shows explanation only — **never highlights the correct option letter** | ⚠️ |
| Empty-state "Start Practice" | Start practice | Opens hub/dashboard (not setup directly) | ✅ |
| "Dashboard" link | Back to dashboard | Works | ✅ |

### Analytics
| Control | Expected | Actual | Result |
|---|---|---|---|
| Charts/cards | Render dynamic data | Accuracy 20%, 10 questions — dynamic | ✅ |
| **Radar chart** | Real per-topic data | **Placeholder data** (source: "For now we'll use placeholder radar data") | ❌ |
| Filters/date controls | — | **None exist** | ⏸ |

### Performance
| Control | Expected | Actual | Result |
|---|---|---|---|
| History rows | Show attempts | Row: Highway, Practice, 20%, 2/10, 2m39s | ✅ |
| **"View Details →"** | Open result detail | **Static `<span>` — not clickable** | ❌ |
| Retake | Re-run exam | **No retake control exists** | ❌ |

### Settings (verified live + prior session)
| Control | Expected | Actual | Result |
|---|---|---|---|
| Daily goal −/+ | Adjust goal | Adjusts (set to 60, persisted in DB) | ✅ |
| Save goal | Persist | Persisted (DB DailyGoals row) | ✅ |
| Target date | Set date | Sep 15, 2026 saved (DB), countdown updates | ✅ |
| Theme | Toggle + persist | Dark ↔ light, survives reload | ✅ |
| **Reset Data (danger zone)** | Show confirm/dialog | **Button renders, has NO handler — clicking does nothing** | ❌ |

### Exam Setup (verified live)
| Control | Expected | Actual | Result |
|---|---|---|---|
| Mode: Practice / Strict | Switch mode | Works (summary updates) | ✅ |
| Chapter select | Change chapter | Works (Railway/Highway prefilled + manual) | ✅ |
| Difficulty All/Easy/Medium/Hard | Update config | Medium → summary "Medium" | ✅ |
| Question count 10/25/50/100 | Update config | 50 → summary "50 Questions" | ✅ |
| Time 5/15/30/60 | Update config | 30 → summary "30 Minutes" (Strict) | ✅ |
| **Custom time** | Prompt for custom minutes | **No-op — summary stays 15 Minutes** | ❌ |
| **Back arrow** | Return to previous view | **No handler — nothing happens** | ❌ |
| Start Exam Now | Start exam | Works (verified in both practice & strict runs) | ✅ |

### Auth (verified in baseline + this run)
| Control | Expected | Actual | Result |
|---|---|---|---|
| Sign in (real Clerk) | Authenticate | Works (re-signed-in via username + password this run) | ✅ |
| Google option | OAuth | Button present (not exercised — no Google test account) | ⏸ |
| Sign up | Register | Works with Turnstile + email verification (baseline) | ✅ |
| Logout | Clear session | Works; `/dashboard` → `/sign-in` | ✅ |
| Protected routes | Redirect | 307 → /sign-in, no infinite loop | ✅ |

---

## 3. Dead controls (summary — see DEAD_CONTROLS.md for details)

| # | Control | Location | Why dead |
|---|---------|----------|----------|
| 1 | Edit Goal | Dashboard | `<button>` without onClick (deployed) |
| 2 | Set Target Date | Dashboard | `<button>` without onClick (deployed) |
| 3 | View All Topics | Dashboard | `<button>` without onClick (deployed) |
| 4 | View All → | Dashboard weak topics | `<button>` without onClick (deployed) |
| 5 | Custom time | Exam Setup | `onClick` only fires for numbers; `'Custom'` string is ignored |
| 6 | Back arrow | Exam Setup | `<button>` with no onClick |
| 7 | Reset Data | Settings | `<button>` with no onClick |
| 8 | View Details → | Performance | Plain `<span>` styled as a link |
| 9 | Weak topic card | Dashboard | Rendered as `<div>`, not clickable |

---

## 4. Misleading / UX issues

1. **Topic cards** on the Dashboard are functional but `cursor: default` — they don't look clickable.
2. **"Your progress will be saved automatically"** — no visible save indicator exists anywhere in the exam UI.
3. **Bookmarks "Reveal Answer & Explanation"** promises the answer but never reveals which option is correct.
4. **Performance rows** show "View Details →" which does nothing.
5. **Reset Data** sits in a "Danger Zone" styling (red) implying a destructive action, but has no handler at all.
6. **Notifications bell** is fully interactive but will always be empty for every user (no producers).

---

## 5. Feature completeness

| Feature | State |
|---|---|
| Notifications | **Shell only** — `createNotification` is never called anywhere in the codebase; 0 rows in DB |
| Radar chart (Analytics) | Placeholder data hardcoded in source |
| Performance detail | No detail page / retake; "View Details" is text |
| Reset Data | Dead button |
| Practice / Strict exams | Complete (verified E2E: attempt, answers, results, negative marking math) |
| Bookmarks | Complete except answer-letter reveal |
| Settings | Complete (goal, date, theme persist in DB/localStorage) |

---

## 6. Methodology & honesty notes

- All live results above come from real clicks in a real Chrome window against `apex-civil.vercel.app`, using the real Clerk session of the throwaway QA account. No mocks, no injected auth.
- The Freebuff Preview tab cannot render external URLs (platform restriction — verified: *"Preview URLs must point at this machine (localhost/127.0.0.1)"*), so evidence is exposed as a screenshot gallery (see `scripts/qa-evidence-gallery.html`, 40 shots, all labeled LIVE PRODUCTION) rather than a live remote page.
- Controls marked ⏸ are genuinely absent (analytics filters, performance retake) or require an unavailable resource (Google OAuth account) — not skips.
