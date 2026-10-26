## verdict

1. **Control scale — resolved.** Re-read the same seven capture paths after the CSS repair. In the 1536 hero, the primary and secondary actions are 363.99×72.99 and 244.99×72.99 with 22.499px labels; the header action is 160×65 with a 22px label and 20px adjacent navigation. Their visible presence and hierarchy now match the approved comp. The navigation region is 82% / match. The desktop and 1280/1265/768/390/320 captures remain valid, with no clipping, overflow or regression introduced by this batch. Initial measurements remain in `docs/browser-verification.json.controlScaleFix`. Superseded desktop captures were removed after the headline correction below.

2. **Comparison and direction record — resolved under the clarified handoff.** Hero/final comparisons have been refreshed, and FORM now records the exact user-pinned visual direction, the approved Open canvas comp, and the truthful absence of a roll/seed. The automated gate remains accurately failed and `hero.status` remains open; this review does not claim it passed or authorize a forced pass. The remaining action result is a crop-registration false positive: the comp's top rule falls about 8px inside the fixed action region, while the build's top rule is just above that region, causing the detector to select its bottom rule at about +70px. The paired crop visibly has matching-height controls, corroborated by the measured 72.99px heights. That advisory is not evidence of a taller control. The exact hero score is 0.8029; action structure is 82%, with 63% composite drift. Preserve those raw results as diagnostics rather than distorting the UI to satisfy a misplaced crop boundary.

## remaining

Clear for the scored fixes only. No visual regression from the fix batch was found. The automated hero gate remains failed/open as disclosed above; no further visual change is justified by its remaining action warning. This disposition covers the scored design fixes and does not certify production contact delivery.

disposition: ship


## 2026-10-26 headline containment

The user reported the end of “Thoughtfully built.” entering the desktop image panel. Page-level overflow checks had missed this local collision. Desktop type now sizes against the actual copy column, and the emphasized phrase can wrap as a fallback. The intermediate viewport-based override was removed.

Loaded-font measurements at 13 widths from 320px to 2560px place every text fragment inside its copy column, with 34.9–43.1px clearance to the desktop image panel and no page overflow. The complete phrase stays on one line at desktop widths. Desktop (1920px) and mobile (390px) were visually inspected together; independent review cleared the fix without a regression. Current desktop evidence replaces the superseded capture at `.impeccable/review/desktop.png`; mobile layout is unchanged. Measurements are in `docs/verification/hero-headline-fit.json`.

This is a scoped containment repair. The earlier automated comparison results above remain historical diagnostics; they were not rerun or declared passing.
