## verdict

1. **Control scale — resolved.** Re-read the same seven capture paths after the CSS repair. In the 1536 hero, the primary and secondary actions are 363.99×72.99 and 244.99×72.99 with 22.499px labels; the header action is 160×65 with a 22px label and 20px adjacent navigation. Their visible presence and hierarchy now match the approved comp. The navigation region is 82% / match. The desktop and 1280/1265/768/390/320 captures remain valid, with no clipping, overflow or regression introduced by this batch. Evidence: `hero-repro.png`, `desktop.png`, `mobile.png`, the four `user-*.png` captures, and `docs/browser-verification.json.controlScaleFix`.

2. **Comparison and direction record — resolved under the clarified handoff.** Hero/final comparisons have been refreshed, and FORM now records the exact user-pinned visual direction, the approved Open canvas comp, and the truthful absence of a roll/seed. The automated gate remains accurately failed and `hero.status` remains open; this review does not claim it passed or authorize a forced pass. The remaining action result is a crop-registration false positive: the comp's top rule falls about 8px inside the fixed action region, while the build's top rule is just above that region, causing the detector to select its bottom rule at about +70px. The paired crop visibly has matching-height controls, corroborated by the measured 72.99px heights. That advisory is not evidence of a taller control. The exact hero score is 0.8029; action structure is 82%, with 63% composite drift. Preserve those raw results as diagnostics rather than distorting the UI to satisfy a misplaced crop boundary.

## remaining

Clear for the scored fixes only. No visual regression from the fix batch was found. The automated hero gate remains failed/open as disclosed above; no further visual change is justified by its remaining action warning. This disposition covers the scored design fixes and does not certify production contact delivery.

disposition: ship
