# Lessons Learned - Brightside Design Audit 2026

## About This Document
This document captures critical pitfalls, working patterns, and CSS architecture lessons discovered during design-to-code implementation. It is cumulative: the top section summarizes today, and the sections below preserve historical lessons that still matter.

## How To Maintain This Document
Keep updates small, specific, and easy to scan.

- Add a lesson only when it is repeatable, actionable, and likely to matter again.
- Put the newest useful finding near the top so future agents see it first.
- Prefer one lesson per heading with a short problem, solution, and lesson block.
- Merge duplicates instead of adding another scattered note about the same issue.
- Move stable, broadly useful guidance into the durable reference sections below.
- Keep session-specific notes in the top summary; keep long-lived patterns in the thematic sections.
- Update the "Last Updated" date whenever you make a meaningful content change.

### Recommended Update Flow
1. Capture the exact issue and the smallest verified fix.
2. Check whether the lesson already exists elsewhere in the doc.
3. Add or revise one concise section instead of appending a new scattered bullet.
4. Verify the note reads as a future instruction, not a changelog entry.
5. Reorder or merge sections if the same idea appears more than once.

### What Not To Do
- Do not leave behind one-off debugging notes that cannot guide future work.
- Do not duplicate the same lesson in multiple places.
- Do not bury important rules inside long paragraphs without headings.
- Do not treat this as a full project log; keep it as a living reference.

---

## Major Updates From Today

### Session Summary
- Refreshed the site against the current Brightside design, including asset swaps and favicon updates.
- Updated global presentation details such as text color, button/link states, and card styling to better match the design direction.
- Tuned the header, hero, and responsive layouts so desktop and mobile align more consistently with the Figma reference.
- Added and refined accessibility labels for meaningful illustrations while leaving decorative icons out of the screen reader flow.
- Matched the How We Work card shadow to the What We Do cards so the visual language stays consistent.
- Fixed the contact email copy button so touch interactions show the copied confirmation state instead of staying on the pre-copy prompt.
- Verified changes in the browser as the source of truth, and reloaded stale previews before assuming a change had not landed.

**Lesson:** Keep the session summary at the top-level so future agents can quickly see the broad goals and outcomes before reading the detailed pitfalls.

---

## CSS Cascade & Specificity Pitfalls

### ⚠️ Problem: `inherit` Cascades UP, Not Back to Rules
**What happened:** 
```css
.section-description { font-size: 20px; }  /* Global */
.contact .section-description { font-size: inherit; }  /* Specificity 0,0,2 WINS */
```

When a more-specific rule uses `inherit`, it cascades **UP through parent elements**, not back to the less-specific CSS rule. This caused contact body copy to render at wrong size.

**Solution:** Always explicitly set values instead of `inherit` when overriding:
```css
.contact .section-description {
    font-size: 20px;
    line-height: 28px;
    font-family: 'Aktiv_Grotesk', Arial, Helvetica, sans-serif;
}
```

**Lesson:** Never use `inherit` as a workaround for cascade issues. Explicitly state the final value.

---

### ⚠️ Problem: Generic Rules Override Section-Specific Rules
**What happened:**
```css
.section-heading .eyebrow + p { margin-top: 10px; }  /* Specificity 0,0,3 */
.contact .section-heading .eyebrow + p { margin-top: 18px; }  /* Specificity 0,0,4 */
```

The generic rule had LOWER specificity but was still matching the selector and sometimes winning depending on rule order in cascade.

**Solution:** Create explicit section-specific rules with HIGHER specificity:
```css
/* Generic for most sections */
.services .section-heading .eyebrow + p,
.process .section-heading .eyebrow + p {
    margin-top: 10px;
}

/* Section-specific overrides with higher specificity */
.feature .section-heading .eyebrow + p,
.team .section-heading .eyebrow + p,
.contact .section-heading .eyebrow + p {
    margin-top: 18px;
}
```

**Lesson:** Use section-scoped rules to ensure predictable cascade. Don't rely on rule order alone.

---

### ⚠️ Problem: Fragmented CSS Rules for Same Selector
**What happened:** Multiple `.contact p` rules scattered across CSS file:
- Line 431: `.contact p { margin: 0; }`
- Line 640: `.contact p { max-width: 38rem; }`
- Line 786 (mobile): `.contact p { font-size: 1.125rem; }`

This fragmentation made cascade unclear and prone to override issues.

**Solution:** Consolidate all properties for a selector into a single rule, add section-specific overrides below:
```css
/* CONSOLIDATED RULE */
.contact p {
    max-width: 38rem;
    font-family: 'Aktiv_Grotesk', Arial, Helvetica, sans-serif;
    color: #272a2e;
    line-height: 28px;
    font-size: 20px;
    letter-spacing: 0;
    font-weight: 400;
}

/* OVERRIDE RULES BELOW */
.contact .section-description {
    margin-bottom: 0;
    font-weight: 400;
}
```

**Lesson:** Consolidate CSS rules to a single source of truth. Never scatter same selectors across file.

---

## Design-to-Code Accuracy Pitfalls

### ⚠️ Problem: Figma Context Extraction ≠ Actual Design Values
**What happened:** Figma MCP returned React/Tailwind code with CSS variable references (`var(--sds-typography-body-size-large)`) instead of direct hex colors and exact pixel sizes.

**The issue:** 
- Background colors were set at frame level, not extracted at element fill level
- CSS variable fallback values sometimes diverged from actual Figma fills
- Spacing tokens needed to be understood at hierarchy level (outer container gap vs. inner element gap)

**Solution:** Always verify extracted values against:
1. Figma UI directly (inspect frame fill, not just component code)
2. Screenshot comparison at 1:1 scale (visual validation, not code alone)
3. Rendered page measurements (use Playwright to verify computed styles)

**Exact Specs Required:**
- Contact outer spacing (image to text): **64px** (Figma: gap-[64px])
- Contact inner spacing (text elements): **24px** flex gap
- Contact heading→body margin: **18px** (margin-top on eyebrow + p)
- Contact body copy: **20px/28px Aktiv_Grotesk** (not Halyard Text)
- Team body copy: **18px/30px Halyard Text** (NOT Aktiv_Grotesk)

**Lesson:** Never trust design extraction alone. Always cross-validate with rendered output and visual comparison.

---

### ⚠️ Problem: HTML Class Removal by Formatters
**What happened:** Formatter removed `.section-description` class from We're Brightside paragraph, causing it to lose proper typography and spacing rules.

**Solution:** Add defensive CSS specificity so class removal doesn't cause cascading failures:
```html
<!-- HTML -->
<h2 class="eyebrow">We're Brightside</h2>
<p class="section-description">Brightside is Trish and Brian...</p>  <!-- CLASS REQUIRED -->
```

```css
/* CSS rule tied to class */
.intro-copy .section-description {
    margin-top: 18px;
    font-family: 'Halyard Text', 'Aktiv_Grotesk', Arial, Helvetica, sans-serif;
    font-size: 18px;
    line-height: 30px;
    font-weight: 400;
}
```

**Lesson:** Keep critical classes in HTML. Use CSS class selectors for section-specific typography to prevent formatter damage.

---

## Figma Design System Understanding

### Font System (Adobe Typekit)
- **Aktiv_Grotesk**: Navigation, headings, some body copy (weights: 400, 600)
- **Halyard Text**: Feature/Team/Process body copy (18px/30px, weight 400)
- **Contact section** uses Aktiv_Grotesk 20px/28px (NOT Halyard Text)

### Section Backgrounds (Exact Hex)
| Section | Background | Notes |
|---------|-----------|-------|
| Hero | #FFFFFF | Default |
| Services | #FFFFFF | Default |
| Feature | #FFFFFF | Default |
| Process | #FFF9FA | Slightly warm |
| Team | #FFFFFF | Default |
| Contact | #F5F9FF | Slightly cool blue |
| Footer | #FFFFFF | Default |

### Spacing Hierarchy
```
Outer container gap: 64px (between major visual elements)
Internal flex gap: 24px (between text elements within container)
Heading→body margin-top: 18px (via .eyebrow + p selector)
```

**Lesson:** Understand spacing at HIERARCHY level, not just flat measurements.

---

## Working Style & Expectations

### How This User Works
1. **Visual-first validation**: Provides 90% scale design screenshots to compare
2. **Specificity matters**: Will call out when CSS cascade is wrong
3. **Exact hex values**: Expects precise color values, not approximations
4. **Cross-browser measured**: Uses Playwright to verify computed styles
5. **Git-tracked**: Regular commits with detailed messages
6. **Documentation**: Prefers lessons captured for future reference

### What Fails
- ❌ "Just applying fixes without visual comparison"
- ❌ Using `inherit` as cascade workaround
- ❌ Scattered CSS rules for same selector
- ❌ Ignoring specificity when overriding generic rules
- ❌ Trusting design extraction without rendering validation
- ❌ Assuming formatter won't remove classes

### What Works
- ✅ Visual side-by-side comparison (rendered vs. Figma)
- ✅ Explicit CSS values (no `inherit`, no assumptions)
- ✅ Consolidated CSS rules (single source of truth)
- ✅ Section-scoped overrides with higher specificity
- ✅ Playwright measurement verification
- ✅ Detailed git commits explaining cascade fixes

---

## Process for Future Design Audits

1. **Extract Figma context** → get reference code + screenshot
2. **Compare visually** → rendered page vs. design mockup (90% scale)
3. **Measure rendered** → use Playwright to verify computed font-size, spacing, colors
4. **Identify gaps** → note spacing/typography discrepancies
5. **Fix CSS cascade** → check specificity, consolidate rules, test with Playwright
6. **Validate globally** → ensure fix doesn't break other sections
7. **Commit with details** → explain cascade issue + solution
8. **Document lesson** → add to this file for future agents

---

## Mobile Layout Patterns

### ⚠️ Problem: Text Alignment on Mobile Hero
**What happened:** Hero section was centered on mobile, but the design intent was left-aligned to match desktop reading flow.

**Solution:** Use `text-align: left` for mobile hero:
```css
@media (max-width: 720px) {
    .hero {
        text-align: left;  /* NOT center */
    }
    
    .hero__copy-body {
        text-align: left;  /* Button also left-aligned */
    }
}
```

**Lesson:** Don't assume mobile needs center alignment. Respect left-to-right reading flow unless explicitly centered in design.

---

### ⚠️ Problem: Hero Headline Line-Height Too Spacious
**What happened:** Hero h2 had default browser line-height which was too spacious for the design.

**Solution:** Tighten to 1.2em on mobile:
```css
@media (max-width: 720px) {
    .hero h2 {
        font-size: 2.8rem;
        line-height: 1.2em;  /* Tighter than default */
    }
}
```

**Lesson:** Explicitly set line-height for headlines on mobile. Don't rely on inherited defaults.

### ⚠️ Problem: Mobile Nav Only at Smallest Breakpoint
**What happened:** The mobile nav toggle/overlay was initially introduced at the smallest mobile breakpoint, but the rest of the layout began stacking earlier. That caused the nav behavior to appear late and feel disconnected from the responsive layout.

**Solution:** Tie the nav toggle and stacked overlay behavior to the first stacking breakpoint, then reserve the smaller breakpoint for fine-tuning proportions only. Keep the overlay full-screen with a fixed top bar and a separate content field below it.

**Lesson:** When a layout starts stacking, the nav interaction should usually switch with it. Do not wait for the smallest mobile breakpoint unless the design explicitly does.

### ⚠️ Problem: Copy Tooltip Wording On Touch
**What happened:** The copy-email button used the same tooltip wording for every input type, but touch users could still see the pre-copy prompt after tapping because the copied state was not being applied with enough precedence over hover/focus styling.

**Solution:** Keep the touch trigger lightweight, apply a touch-specific state attribute on pointer/touch events, make the copied-state CSS explicitly override the hover/focus tooltip rules, and skip the pre-copy tooltip state entirely so touch users go straight to the confirmation. Validate the behavior in the browser with a real touch interaction, not just through code inspection.

**Lesson:** Match tooltip wording to the interaction mode, and make stateful UI feedback explicit. For touch interactions, the confirmation state should win over hover styling, and the interface should jump straight to the confirmation without showing the pre-copy prompt first.

### ⚠️ Problem: Menu Icon Cropping / Size Drift
**What happened:** The animated hamburger/X toggle visually looked clipped or oversized on mobile Chrome when its internal bar size and container size were adjusted independently.

**Solution:** Treat the toggle as a matched system: keep the outer hit area, icon box, and bar thickness tuned together, then validate the computed bounds in-browser so the icon stays fully inside the button at the target viewport.

**Lesson:** If the icon seems cropped, adjust the icon box and button geometry together. Don't change stroke weight in isolation.

## Accessibility & Image Alt Text

### ⚠️ Problem: Decorative Icons Were Announced Too Verbosely
**What happened:** Several service-card icons were labeled with alt text like "Strategy icon" and "Marketing icon", which added noise without meaningful context.

**Solution:** Mark decorative icons with empty alt text when the surrounding heading and body copy already explain the content:
```html
<img class="service-card__icon" src="..." alt="">
```

**Lesson:** If an icon is purely decorative or redundant in context, leave it out of the screen reader flow. Do not announce "icon" just because it is an image.

### ⚠️ Problem: Main Illustrations Needed Short, Contextual Alt Text
**What happened:** The hero, feature, and contact illustrations needed descriptions that were helpful but not overly detailed or repetitive.

**Solution:** Use concise alt text that matches the surrounding content and purpose:
- Hero illustration: describe the subject, not the file name
- Feature illustration: tie it to the nearby section content
- Contact illustration: describe the messaging cue in plain language

**Lesson:** For meaningful illustrations, keep alt text short, specific, and contextual. Avoid verbose descriptions and avoid repeating nearby copy.

### ⚠️ Problem: It Was Easy to Confuse Which Image Was Being Fixed
**What happened:** The hero illustration, contact illustration, and service icons all live on the same page, so it was easy to check the wrong image and assume the change had not landed.

**Solution:** Verify the exact DOM element and visible section before editing, then refresh the browser preview after the change to confirm the right asset updated.

**Lesson:** When a page has multiple illustrations, confirm the target element first and reload the preview before drawing conclusions from a stale screen.

---

## Historical Fixes

The items below were captured in an earlier session and are kept here because they remain useful reference points.

### Fixed Issues
✅ CSS specificity: eyebrow + p margin-top rules now section-aware  
✅ Contact font-size cascade: Changed from `inherit` to explicit `20px`  
✅ HTML structure: Restored `.section-description` class to We're Brightside  
✅ Contact wrapper: Added `.contact__text` div for proper spacing hierarchy  
✅ Global typography: Body copy corrected to Halyard Text 18px/30px  
✅ Mobile hero: Left-aligned text and button (not centered)  
✅ Mobile hero image: Reduced spacing from 50px to 30px to match feature section  
✅ Mobile team avatars: Centered as a group via justify-items: center  
✅ Hero headline: Tightened line-height to 1.2em  
✅ Image accessibility: Added concise alt text to main illustrations  
✅ Decorative icons: Removed redundant alt text from service-card icons  

### Cascade Problems Discovered
1. Generic `.section-heading .eyebrow + p { margin-top: 10px; }` was overriding section-specific rules
2. `.contact .section-description { font-size: inherit; }` broke design by cascading UP to parent elements
3. Multiple scattered `.contact p` rules made cascade unpredictable
4. Mobile text-align assumptions (centered) diverged from actual design (left-aligned)
5. Default headline line-height was too spacious on mobile

### Root Cause
Design extraction provided CSS variables instead of exact values, and visual validation was skipped before implementing CSS. This led to guessing at specificity and cascade order. Mobile assumptions were made without verifying design intent.

---

**Last Updated:** 2026-08-04  
**Next Agent:** Please read this before making CSS changes. Always validate visually and measure rendered output. Remember: mobile defaults to left-align unless explicitly centered in design.
