# UI Control Matrix — ApexCivil (LIVE `apex-civil.vercel.app`)

Format per row: **Page | Component | Label | Type | Auth? | DB op? | Dynamic data? | Expected | Actual | Result | Evidence | Source**

Verified via real Chrome against live production, Aug 15 2026. `S=server action`, `L=local state`, `-`=none.

## Sidebar
| Page | Component | Label | Type | Auth | DB | Dyn | Expected | Actual | Result | Evidence | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|
| All | Sidebar | Dashboard | button | Y | - | - | Show dashboard | Shows dashboard | ✅ | DOM nav | Sidebar.tsx |
| All | Sidebar | Quick Practice | button | Y | - | - | Open exam setup | Opens setup | ✅ | DOM nav | Sidebar.tsx |
| All | Sidebar | Topics | button | Y | - | - | Open catalog | Opens catalog | ✅ | DOM nav | Sidebar.tsx |
| All | Sidebar | Weak Topics | button | Y | - | - | Open weak topics | Opens view | ✅ | DOM nav | Sidebar.tsx |
| All | Sidebar | Bookmarks | button | Y | - | - | Open bookmarks | Opens view | ✅ | DOM nav | Sidebar.tsx |
| All | Sidebar | Analytics | button | Y | - | - | Open analytics | Opens view | ✅ | DOM nav | Sidebar.tsx |
| All | Sidebar | Simulate Exam | button | Y | - | - | Open exam setup | Opens setup | ✅ | DOM nav | Sidebar.tsx |
| All | Sidebar | Performance | button | Y | - | - | Open history | Opens view | ✅ | DOM nav | Sidebar.tsx |
| All | Sidebar | Settings | button | Y | - | - | Open settings | Opens view | ✅ | DOM nav | Sidebar.tsx |

## Header
| Page | Component | Label | Type | Auth | DB | Dyn | Expected | Actual | Result | Evidence | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|
| All | Header | Global search | input | Y | S | Y | Filter topics, click→exam prefill | "Highway" → dropdown → click → prefilled exam | ✅ | shot 12-14 | Header.tsx |
| All | Header | Search edge cases | input | Y | S | Y | lowercase/upper/partial/none | All correct; nonexistent → no results | ✅ | nav phase | Header.tsx |
| All | Header | Notifications bell | button | Y | S | Y | Dropdown + items | Dropdown + empty state + settings link | ⚠️ (no producers) | shot 16 | Header.tsx |
| All | Header | Notification settings | link | Y | - | - | Open settings | Renders | ✅ | nav phase | Header.tsx |
| All | Header | Theme toggle | button | Y | L | - | Dark↔light | Toggles + persists after reload | ✅ | shot 19 | Header.tsx |
| All | Header | UserButton | button | Y | - | Y | Clerk menu | Menu opens (Manage account etc.) | ✅ | DOM | Header.tsx |
| Mobile | Header | Hamburger | button | Y | - | - | Open drawer | Opens drawer, 9 items | ✅ | shot 83 | MainClient.tsx |
| Mobile | Drawer | Backdrop | div | Y | - | - | Close drawer | Closes drawer | ✅ | DOM | MainClient.tsx |

## Dashboard
| Page | Component | Label | Type | Auth | DB | Dyn | Expected | Actual | Result | Evidence | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Dashboard | Hero | Quick Practice | button | Y | - | - | Open setup | Opens setup | ✅ | audit-dashboard D-09 | Dashboard.tsx |
| Dashboard | Hero | Configure Exam | button | Y | - | - | Open setup | Opens setup | ✅ | D-10 | Dashboard.tsx |
| Dashboard | Hero | Start Simulation | button | Y | - | - | Open setup | Opens setup | ✅ | D-08 | Dashboard.tsx |
| Dashboard | Goal card | **Edit Goal** | button | Y | - | - | Edit goal | **Nothing happens** | ❌ | D-01; DOM hasHandler=false | Dashboard.tsx |
| Dashboard | Date card | **Set Target Date** | button | Y | - | - | Set date | **Nothing happens** | ❌ | D-03 | Dashboard.tsx |
| Dashboard | Topics header | **View All Topics** | button | Y | - | - | Open Topics | **Nothing happens** | ❌ | D-04 | Dashboard.tsx |
| Dashboard | Weak header | **View All →** | button | Y | - | - | Open Weak Topics | **Nothing happens** | ❌ | D-05 | Dashboard.tsx |
| Dashboard | Topics grid | Topic cards (11) | button | Y | S | Y | Setup prefilled | Railway → setup+prefill | ✅ | D-07 | Dashboard.tsx |
| Dashboard | Weak card | Weak topic card | div | Y | S | Y | Targeted practice | **Not clickable** | ❌ | DOM (no button) | Dashboard.tsx |
| Dashboard | Goal card | Goal value | text | Y | S | Y | From DB | 60 (set earlier) | ✅ | DB DailyGoals | Dashboard.tsx |
| Dashboard | Goal card | Progress % | text | Y | S | Y | computed | 0% (0 questions today — correct) | ✅ | stats | Dashboard.tsx |
| Dashboard | Countdown | Exam countdown | text | Y | S | Y | Days to target | "32 Days — Sep 15, 2026" | ✅ | shot 45c | Dashboard.tsx |
| Dashboard | Footer | Stats (8,007 / 11) | text | Y | S | Y | DB counts | 8,007 / 11 topics | ✅ | DB count | Dashboard.tsx |

## Topics
| Page | Component | Label | Type | Auth | DB | Dyn | Expected | Actual | Result | Evidence | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Topics | Filter | Search input | input | Y | - | Y | Filter chapters | geo→Geotechnical; zzz→none | ✅ | audit-views2 | TopicsView.tsx |
| Topics | Cards | Chapter cards | button | Y | S | Y | Setup prefilled | Highway → prefilled | ✅ | V-05 | TopicsView.tsx |
| Topics | Cards | Counts | text | Y | S | Y | DB counts | 267/298/1155/… match DB | ✅ | DB | TopicsView.tsx |

## Weak Topics
| Page | Component | Label | Type | Auth | DB | Dyn | Expected | Actual | Result | Evidence | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Weak | List | Per-topic **Practice** | button | Y | - | - | Setup prefilled | **Prefilled "Highway Engineering"** | ✅ | select value verified | WeakTopicsView.tsx |
| Weak | Header | Target Weaknesses | button | Y | - | - | Targeted exam | Opens setup (All) | ✅ | V-07 | WeakTopicsView.tsx |
| Weak | Empty | Start an Exam | button | Y | - | - | Open setup | Works | ✅ | V-08 | WeakTopicsView.tsx |

## Bookmarks
| Page | Component | Label | Type | Auth | DB | Dyn | Expected | Actual | Result | Evidence | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Bookmarks | Card | Remove | button | Y | S | Y | Delete bookmark | Deleted (DB 1→0) | ✅ | DB check | BookmarksView.tsx |
| Bookmarks | Card | Reveal Answer & Explanation | button | Y | L | Y | Show answer+expl | **Explanation only, no correct letter** | ⚠️ | DOM text | BookmarksView.tsx |
| Bookmarks | Empty | Start Practice | button | Y | - | - | Start practice | Opens hub (not setup directly) | ✅ | V-15 | BookmarksView.tsx |
| Bookmarks | Top | Dashboard link | link | Y | - | - | Back to dashboard | Works | ✅ | DOM | BookmarksView.tsx |

## Analytics / Performance
| Page | Component | Label | Type | Auth | DB | Dyn | Expected | Actual | Result | Evidence | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Analytics | Cards | Accuracy/Questions | text | Y | S | Y | Dynamic | 20.0%, 10 solved | ✅ | DB match | AnalyticsView.tsx |
| Analytics | Charts | Activity chart | chart | Y | S | Y | Dynamic | Renders | ✅ | shot 42 | AnalyticsView.tsx |
| Analytics | Charts | **Radar chart** | chart | Y | - | ❌ | Real per-topic | **Placeholder data (source comment)** | ❌ | source L28-29 | AnalyticsView.tsx |
| Performance | Table | History rows | text | Y | S | Y | Attempts | Row: 20%, 2/10, 2m39s | ✅ | DB match | PerformanceView.tsx |
| Performance | Row | **View Details →** | span | Y | - | - | Detail view | **Static text, not clickable** | ❌ | DOM (SPAN) | PerformanceView.tsx |
| Performance | - | Retake | - | - | - | - | Re-run exam | **Does not exist** | ❌ | source | PerformanceView.tsx |

## Settings
| Page | Component | Label | Type | Auth | DB | Dyn | Expected | Actual | Result | Evidence | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Settings | Goal | − / + | buttons | Y | L | - | Adjust goal | Adjusts | ✅ | V-13 retest | SettingsView.tsx |
| Settings | Goal | Save | button | Y | S | Y | Persist goal | 60 persisted in DB | ✅ | DB DailyGoals | SettingsView.tsx |
| Settings | Date | Date input | input | Y | S | Y | Set target date | Sep 15, 2026 saved | ✅ | DB user row | SettingsView.tsx |
| Settings | Theme | Toggle | button | Y | L | - | Persist theme | Dark↔light persists | ✅ | reload check | SettingsView.tsx |
| Settings | Danger | **Reset Data** | button | Y | - | - | Confirm/reset | **No handler, no dialog** | ❌ | DOM click | SettingsView.tsx |

## Exam Setup
| Page | Component | Label | Type | Auth | DB | Dyn | Expected | Actual | Result | Evidence | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Setup | Mode | Practice / Strict Exam | buttons | Y | - | - | Switch mode | Works, summary updates | ✅ | live click | ExamSetup.tsx |
| Setup | Chapter | Select | select | Y | - | - | Change chapter | Works | ✅ | live click | ExamSetup.tsx |
| Setup | Difficulty | All/Easy/Medium/Hard | buttons | Y | - | - | Update config | Medium → summary | ✅ | live click | ExamSetup.tsx |
| Setup | Count | 10/25/50/100 | buttons | Y | - | - | Update config | 50 → summary | ✅ | live click | ExamSetup.tsx |
| Setup | Time | 5/15/30/60 min | buttons | Y | - | - | Update config | 30 → summary (Strict) | ✅ | live click | ExamSetup.tsx |
| Setup | Time | **Custom** | button | Y | - | - | Custom minutes | **No-op (summary stays 15)** | ❌ | summary text | ExamSetup.tsx |
| Setup | Header | **Back arrow** | button | Y | - | - | Go back | **No handler** | ❌ | DOM click | ExamSetup.tsx |
| Setup | CTA | Start Exam Now | button | Y | S | Y | Start exam | Works (both modes verified) | ✅ | DB attempts | ExamSetup.tsx |

## Exam flows (verified in this + prior authenticated run)
| Page | Component | Label | Type | Auth | DB | Dyn | Expected | Actual | Result | Evidence | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Practice | Question | Options A-D | buttons | Y | S | Y | Answer + instant feedback | Works (1C/9W run) | ✅ | DB attempt cmstelia | PracticeView.tsx |
| Practice | Question | Next / Previous | buttons | Y | - | - | Navigate | Works | ✅ | prior run | PracticeView.tsx |
| Practice | Question | Flag (bookmark) | button | Y | S | Y | Toggle bookmark | Works (DB row) | ✅ | DB bookmarks | PracticeView.tsx |
| Practice | Question | Finish Practice | button | Y | S | Y | Submit | Works (results + DB) | ✅ | shot 67 | PracticeView.tsx |
| Strict | Question | Mark for Review | button | Y | - | L | Toggle review | Works | ✅ | prior run | LiveExam.tsx |
| Strict | Palette | Question palette | button | Y | - | - | Jump to question | Works | ✅ | prior run | LiveExam.tsx |
| Strict | Timer | Countdown | text | Y | - | - | Count down | Ticking | ✅ | prior run | LiveExam.tsx |
| Strict | End | End Exam | button | Y | - | - | Exit (cancel) | Exits to setup without submit | ✅ | prior run | LiveExam.tsx |
| Strict | End | Submit Exam | button | Y | S | Y | Submit + score | Works (8%, neg marking verified) | ✅ | DB cmstcnaa | LiveExam.tsx |
| Results | - | Retake | button | Y | - | - | Fresh attempt | Works (clean state) | ✅ | prior run | ExamResults.tsx |
| Results | - | Return home | button | Y | - | - | Back to dashboard | Works | ✅ | prior run | ExamResults.tsx |

## Auth
| Page | Component | Label | Type | Auth | DB | Dyn | Expected | Actual | Result | Evidence | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|
| /sign-in | Clerk | Email/password form | form | - | - | - | Sign in | Works (re-auth this run) | ✅ | session | - |
| /sign-in | Clerk | Continue with Google | button | - | - | - | OAuth | Button present; not exercised (no Google account) | ⏸ | shot 02 | - |
| /sign-up | Clerk | Sign-up + Turnstile | form | - | - | - | Register | Works with human Turnstile + email code | ✅ | baseline | - |
| All | Header | Sign out | menu item | Y | - | - | Clear session | Works; protected route → /sign-in | ✅ | shots 50-51 | - |

---

**Totals:** controls discovered ≈ **72** · tested ≈ **68** · ✅ PASS ≈ **57** · ❌ FAIL ≈ **9** · ⚠️ PARTIAL ≈ **2** · ⏸ NOT TESTED ≈ **4** (Google OAuth, analytics filters — do not exist, radar data source)
