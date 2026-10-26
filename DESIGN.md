---
name: Applicodo
description: Independent iOS development on a light canvas with graphite type and confident blue.
colors:
  blue: "#2254ef"
  blue-deep: "#173fc2"
  blue-soft: "#e1e8ff"
  ink: "#202328"
  muted: "#626875"
  paper: "#ffffff"
  surface: "#f3f5f8"
  line: "#d9dde5"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(2.75rem, 11.5cqw, 5.625rem)"
    fontWeight: 800
    lineHeight: 1.14
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(2.5rem, 3.8vw, 3.75rem)"
    fontWeight: 750
    lineHeight: 1.16
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 650
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1.125rem"
    lineHeight: 1.75
  lead:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(1.25rem, 1.78vw, 1.6875rem)"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "-0.025em"
  button:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 650
    lineHeight: 1.5
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 650
  wordmark:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(1.75rem, 2.8vw, 2.625rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.04em"
rounded:
  retry: "6px"
  field: "8px"
  control: "10px"
  app-icon: "16px"
  product-stage: "24px"
spacing:
  xs: "0.75rem"
  sm: "1rem"
  md: "1.5rem"
  lg: "2rem"
  xl: "3rem"
  section-small: "4rem"
  section-medium: "5rem"
  section-large: "7rem"
  gutter: "clamp(1.5rem, 4vw, 3.75rem)"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.paper}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "1.25rem 1.625rem"
  button-primary-hover:
    backgroundColor: "{colors.blue-deep}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "1.25rem 1.625rem"
  button-secondary-hover:
    backgroundColor: "{colors.surface}"
  button-light:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.blue-deep}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "1.25rem 1.625rem"
  button-light-hover:
    backgroundColor: "{colors.blue-soft}"
  text-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0.875rem 1rem"
  service-row:
    padding: "2.25rem 0"
---

# Design System: Applicodo

## Overview

**Creative North Star: "Open canvas"**

The approved identity is “bold typography, generous spacing, graphite text, light backgrounds, and a confident blue accent.” It presents an independent developer through clear language and authentic iOS work. White and cool pale surfaces keep the experience open; strong Manrope headings and blue actions provide direction.

The system is spacious and direct. Product screens sit in simple device chrome, while content uses open columns and fine rules. Blue can form an entire contact surface as well as an action or highlighted phrase. The chosen first-surface composition and its approved comp remain in `docs/landing-brief.md`; they do not prescribe every future page layout.

**Key Characteristics:**
- Bold, tightly spaced sans-serif headings with relaxed body copy.
- Light surfaces, graphite text and a confident blue accent.
- Authentic app imagery, open content and restrained ruled rows.
- Quiet, optional motion and clearly visible keyboard focus.

## Colors

The palette combines cool paper and graphite with a saturated, purposeful blue. Frontmatter values are normative and retain the source custom-property names.

### Primary

- **Confident Blue** (`blue`): primary actions, linked text, selected text backgrounds, the emphasized headline phrase and the contact plane.
- **Deep Blue** (`blue-deep`): primary hover state and text on the light contact action.
- **Pale Blue** (`blue-soft`): supporting text and rules on the blue plane, plus the light action's hover fill.

### Neutral

- **Graphite** (`ink`): headings, primary copy and secondary action labels.
- **Cool Gray** (`muted`): supporting paragraphs, hints and footer copy on light surfaces.
- **White Paper** (`paper`): the main canvas, field fills and text on blue actions.
- **Cool Pale** (`surface`): broad supporting sections and secondary action hover fill.
- **Fine Rule** (`line`): separators and the understated capability underlines.

**The Purposeful Blue Rule.** Use blue to direct action, emphasize a short phrase or anchor a meaningful section. Its full-width contact use is part of the implemented world; do not impose an invented percentage limit.

## Typography

**Display Font:** Manrope, self-hosted variable font, with a sans-serif fallback.
**Body Font:** Manrope with the same fallback.

**Character:** Compact, heavy headlines establish confidence; readable, more lightly weighted paragraphs keep the service personal. Headings balance their wrapping and paragraphs use natural, comfortable line breaks.

### Hierarchy

- **Display:** from 901px, the frontmatter display role sizes against the `.hero-copy` inline-size container, keeping the complete blue phrase inside its column. Normal wrapping remains a safety net. At tablet widths it becomes `clamp(3.125rem, 8.75vw, 5.625rem)`; on phones, `clamp(2.75rem, 11.7vw, 3.75rem)` with a slightly tighter line height (1.12).
- **Headline:** the frontmatter headline role leads ordinary sections. The work heading uses `clamp(2.375rem, 3.5vw, 3.25rem)`; contact has a larger display treatment, with the phone contact heading at 2.75rem. Ordinary phone section headings settle at 2.5rem.
- **Title:** the title role labels service rows. It reduces to 1.25rem at tablet and phone widths.
- **Body:** the body role describes service and approach copy; project paragraphs use 1.25rem with a 1.7 line height on desktop. Long prose is capped at 65ch. Most phone paragraphs use 1rem with a 1.75 line height.
- **Lead:** the lead role introduces the hero; section introductions use 1.25rem, and the approach lead uses 1.5rem. Their narrower responsive variants retain a clear distinction from supporting copy.
- **Button and label:** buttons use the button role as their base, with explicit responsive sizing for hero and navigation actions. Form labels use the label role; field text is 1rem with a 1.6 line height.
- **Wordmark:** a lowercase typographic wordmark uses the frontmatter wordmark role; the footer and phone header use 1.75rem.

**The One Family Rule.** Keep the interface in Manrope. The implemented system has no decorative display face or code-style monospace role.

## Layout

The shared content container is centered, with a maximum width of 1416px. It subtracts twice the responsive gutter from the viewport; at 540px and below the gutter becomes 1.25rem. The desktop grid repeatedly pairs columns in a 1:1.04 ratio with a 1.5rem gap, aligning the offer, product story, services, approach and contact form.

Sections use generous vertical spans, usually from the section spacing tokens, rather than repeated boxed panels. The product story and service descriptions retain readable line lengths. The hero aligns copy with a pale screen stage; its desktop minimum height is 786px and its intermediate desktop minimum is 680px.

At 900px and below, the hero, approach and contact stack in reading order. Work details and service rows retain two columns until 540px, when they also stack; paired contact fields become one column. Hero actions wrap on desktop and become a start-aligned vertical group on phones. At widths below 360px, the header wraps the wordmark above the navigation. The approved implementation was checked across seven widths without horizontal overflow.

## Elevation & Depth

Most surfaces are flat. Pale section backgrounds, white space and fine rules establish hierarchy. Soft shadows are reserved for the app's device chrome; the secondary button's inset stroke reads as a border. Controls provide an inset pressed response rather than a floating card effect.

### Shadow Vocabulary

- **Device shadow** (`0 19px 28px #1a202333`): app device chrome on larger screens; the phone variant is `0 13px 19px #1a202333`.
- **Secondary action stroke** (`inset 0 0 0 1px #c9cfda`): quiet separation on white; removed from the phone hero's underlined secondary action.
- **Pressed control** (`inset 0 2px 4px #0b2b8640`): shared button active state.

**The Flat Content Rule.** Keep ordinary prose and service rows flat and open. Device framing is a native part of the product presentation and retains its soft shadow.

## Shapes

Controls have modest, functional rounding: buttons use the control radius and fields use the field radius. The verification retry uses the smaller retry radius. The app icon uses its own rounded silhouette, while the product stage is a broad pale rectangle whose radius reduces to 16px on phones.

Device chrome follows the screens' proportions: a dark frame, rounded clipping and a small inset preserve each original screenshot. Desktop frame corners scale from 24px to 47px; phone frames use 23px. Keep screenshot proportions intact. Service rows remain rectangular and unboxed, divided by a single fine rule.

## Components

### Buttons

Confident, readable actions with a clear primary and secondary relationship.

- **Primary:** blue fill with white text, the control radius and frontmatter padding. Hover deepens the fill. All button variants share a subtle inset pressed state.
- **Secondary:** white with graphite text and an inset neutral stroke; hover uses the cool pale surface. On phones, the hero secondary action becomes an underlined text action with no stroke or fill.
- **Light:** white with deep blue text on the contact plane; hover uses pale blue.
- **Responsive scale:** from 1280px, hero actions use a minimum height of `clamp(3.75rem, 4.7526vw, 4.5625rem)` and label size of `clamp(1.125rem, 1.4648vw, 1.4375rem)`. At the reviewed 1536px viewport the primary and secondary actions are approximately 364×73px and 245×73px, with 22.5px labels. The header action is 160×65px with a 22px label at that viewport. These are observed results of responsive rules, not fixed sizes for all screens.
- **Focus and disabled:** keyboard focus is a blue outline (3px, offset 6px); the contact plane uses white. Disabled buttons use opacity 0.72 and a waiting cursor. Submission disables its action while the request is pending and announces status accessibly.

### Inputs / Fields

Plain, generous white fields on the blue contact plane.

- **Shape and text:** frontmatter field padding and radius, a pale blue border (`#b7c6ff`), graphite text and a blue caret. Text inputs have a minimum height of 54px; the resizable project textarea starts at 170px.
- **Focus:** white outline (3px, offset 4px) with a deep blue border. Labels are always visible above the field.
- **Feedback:** status copy sits above the submit action in a live region. Errors increase its weight to 650; the retry action appears only when needed. The public note remains the brief “No analytics. No advertising cookies.”

### Navigation

An open header pairs the lowercase wordmark with text links and a compact primary action. Text links underline on hover. Header spacing and action size scale with the viewport; the narrowest header wraps rather than hiding navigation. The skip link enters view on keyboard focus.

### Capability Tags

Small text labels form a wrapping line of product capabilities. They use graphite text, a fine underline and no filled pill. They communicate product information and have no interactive state.

### Service Rows / Containers

Service rows use a title and a description across the shared two-column grid, separated by fine top rules and a final bottom rule. Their frontmatter padding reduces to 1.75rem vertically on phones. The build does not contain a reusable card pattern; do not invent one from these rows.

### Product Stage

Original app screens appear together in a pale, gently rounded stage, each inside dark device chrome. The second device has a deliberate vertical offset. It settles upward by 12px over 900ms with `cubic-bezier(0.16, 1, 0.3, 1)` only when reduced motion is not requested. Content is always present; reduced-motion mode removes animations, transitions and smooth scrolling.

## Do's and Don'ts

### Do:

- **Do** use the light canvas, graphite typography and blue roles together as one identity.
- **Do** preserve original app screenshot proportions, descriptive alternatives and shipping asset provenance.
- **Do** use open columns, readable paragraph widths and fine rules for content hierarchy.
- **Do** preserve visible keyboard focus, labeled fields, announced feedback and reduced-motion behavior.
- **Do** let navigation, content and actions wrap or stack at the observed breakpoints.

### Don't:

- **Don't** replace real product work with stock team photography, invented dashboards, testimonials or statistics.
- **Don't** introduce decorative gradients, glass, code-style monospace, repeated icon cards or section numbering into this approved world.
- **Don't** turn the service rows into a reusable raised-card pattern.
- **Don't** hide key copy, actions or form fields to make a composition fit.
