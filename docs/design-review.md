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

## 2026-11-11 portfolio extension — security review

Independent source review cleared the RentalBench and GarageClerk addition. The contact functions/client, headers, routes, Wrangler configuration and dependency manifests remain byte-identical to the preceding release. All project destinations are direct HTTPS, same-tab, followable anchors. Both new SVGs match their original source files and contain no executable content or external resource references; the screenshot pixels match their documented synthetic-fixture sources, with provenance embedded in the shipping images.

The independently repeated output verifier passes: 20 allowlisted public files, 730,029 bytes, correct CSS content-hash links in both HTML entrypoints, no source/secrets/legacy output, and no new runtime trust boundary. The release agent reports 28 passing contact test results. This verdict covers source and publication-boundary changes only; visual review and deployed checks are recorded separately, and no additional real enquiry was sent.

Security disposition: clear for release.

## 2026-11-11 portfolio extension — visual review

Independent Impeccable finish review returned `disposition: ship` with no material fixes. Both scoped captures show the complete work section at 1440px and 390px. The reviewer checked CaptionFast's lead, the open desktop project rows, stacked mobile sequence, original-logo correction, proportional authentic imagery, responsive GarageClerk lanes and four direct followable project links against the brief and review board. These element captures deliberately omit the outer shell gutters and are not full-page screenshots.

Loaded-font checks at nine widths from 320px to 1920px found no page overflow or local hero text collision. All four project actions received visible keyboard focus; reduced motion remained active when requested, all selected images loaded, and no page errors or third-party requests occurred. Text contrast on white is 5.59:1 for supporting copy, 5.86:1 for blue links and 15.76:1 for graphite. Measurements are in `docs/verification/portfolio-layout.json`; final scoped captures are `.impeccable/review/portfolio-desktop.png` and `portfolio-mobile.png`.

The detector ran once. Its cramped-padding warnings concern the unchanged services, approach and contact sections; remaining type/radius/color advisories do not override the existing design or the measured spacing. The historic hero comparison remains failed/open and was not rerun or claimed as passing for this local extension.

The independent documenter also cleared the extension: PRODUCT.md, the scoped brief, provenance, HTML/CSS and both captures agree with the Additional Web Projects documentation. The incumbent token sidecar is preserved; no design-system rewrite or new tokens are required.
