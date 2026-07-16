# Recreate this design for SOG Glass & Aluminum Services in Next.js + Tailwind CSS

You are an expert product designer and senior front-end engineer. Recreate the editorial, motion-rich visual language of the supplied **Baseline — Tennis Club & Academy** reference, but transform it into a premium website for **SOG Glass & Aluminum Services**.

Do not make a tennis-themed site and do not copy tennis language, imagery, icons, statistics, or interactions literally. Preserve the reference's strongest design ideas—full-bleed photography, oversized typography, rounded section framing, alternating light/dark bands, layered image cards, restrained glass effects, polished motion, and clear conversion paths—while making every detail relevant to glass fabrication, aluminum systems, on-site measurement, quotation, installation, and after-sales service.

Implement the result directly in the existing project using **Next.js App Router, React, TypeScript, Tailwind CSS v4, Framer Motion, Lucide React, and `next/image`**. This is not a single HTML file.

## Product and business context

SOG is a glass and aluminum fabrication and installation company serving residential and commercial customers. Its core value proposition is:

- One shop for glass and aluminum products
- Free on-site inspection and precise measurement
- Clear, itemized quotations
- Custom fabrication to exact dimensions
- Professional installation and after-sales support
- Optional AR visualization before ordering

Primary conversion: **Get a Free Quote** → `/get-quote`

Secondary conversions:

- **Explore Products** → `/products`
- **Track a Request** → `/track`
- **Book an Inspection** → `#booking`

Use **Philippine English**, display prices in **PHP** where product data supplies them, and retain SOG's actual service areas and contact information already present in the repository. Do not invent certifications, warranties, addresses, phone numbers, project counts, ratings, or customer names that are not present in project data or existing copy.

## Technical requirements

- Work inside the existing `frontend` Next.js application.
- Use the App Router and TypeScript. Keep `app/page.tsx` server-rendered where practical; isolate only interactive pieces behind `"use client"` boundaries.
- Use Tailwind CSS v4 utilities for the visual system. Use a CSS module or `app/globals.css` only for effects that are genuinely awkward in utilities, such as complex masks or continuous marquee tracks.
- Use existing dependencies. Do not add another animation, carousel, icon, or smooth-scroll package.
- Use Framer Motion for entrances, section reveals, carousel transitions, and micro-interactions. Use Lucide React for interface icons.
- Use `next/image` for local and known remote images. Provide meaningful `alt` text, dimensions or `fill`, and correct `sizes`. Only the hero image should use `priority`.
- Prefer semantic HTML: one `h1`, logical `h2`/`h3` hierarchy, `<nav>`, `<section>`, `<article>`, `<figure>`, `<blockquote>`, `<dl>`, and accessible buttons.
- Respect `prefers-reduced-motion`. Remove parallax and large transforms when reduced motion is enabled; never hide essential content behind animation.
- All controls must be keyboard-accessible with visible focus states. Carousels need labels, previous/next buttons, status/dots, and must pause when hovered or focused.
- Avoid custom viewport-based root font-size scaling. Use fluid typography with Tailwind breakpoints and `clamp()` where appropriate.
- Avoid horizontal overflow at 320px. Build mobile-first and verify at 390px, 768px, 1024px, and 1440px.
- Preserve existing quote, product, authentication, API, and customer flows. Do not replace real functionality with mock forms or dead buttons.
- If an API request fails, show a graceful fallback or existing error state. Keep loading skeletons for dynamic product content.
- No lorem ipsum, fake social-proof logos, fake testimonials, fabricated case studies, or decorative UI that implies functionality it does not have.

## Visual direction

The site should feel like a premium architectural materials brand: precise, assured, luminous, and engineered.

Use this palette unless existing SOG theme variables map to equivalent brand colours:

```css
--background: #ffffff;
--foreground: #101820;
--brand: #608db9;
--brand-strong: #2c5282;
--brand-deep: #162d4a;
--brand-light: #c8dae8;
--surface: #f3f6f8;
--surface-blue: #eaf2f8;
--muted: #667584;
--hairline: #dce4ea;
--on-brand: #ffffff;
```

Visual principles:

- White page frame with inset, rounded content bands on larger screens
- Deep blue hero and footer
- Oversized, condensed-feeling editorial headlines with tight tracking
- Soft blue-grey surfaces and fine borders
- Architectural photography with cool, neutral colour grading
- Glassmorphism used sparingly and only over photographs/dark surfaces
- Large radii: cards `1.5rem`, feature bands `2rem–2.5rem`, pills fully rounded
- Generous whitespace and asymmetric image compositions
- Motion should feel controlled and mechanical, not playful or bouncy

Use the existing font configuration from `app/layout.tsx`. Do not load a duplicate Google font unless the current brand system has no suitable display face.

## Information architecture

Build the landing page in this order:

1. Header inside the hero
2. Hero
3. Trust/value proposition
4. Services
5. Featured installations / capabilities
6. Process
7. Products fed by the existing API
8. Verified business statistics
9. FAQ
10. Booking / quote CTA
11. Footer

The overall page should retain the reference's rhythm of **dark hero → light editorial content → soft service list → image-led showcase → dark stats/process band → proof/content grid → dark footer**.

## 1. Header

Place the header over the hero photograph.

- Left: SOG logo using the existing local logo asset.
- Desktop centre navigation: `Services`, `Products`, `How It Works`, `FAQ`.
- Right: `Track Request`, primary `Get a Quote`, and a compact mobile menu button.
- Use `next/link`; route links must point to real existing routes and section links to valid IDs.
- Header is transparent at the top. When scrolling, it may become a compact blurred navy/white surface, but avoid layout shift.
- Mobile menu is a full-screen or large sheet-style overlay with focus management, Escape-to-close, scroll locking, and the same routes.

## 2. Hero

Create a full-height, rounded hero framed by a small white page inset.

- Background: use the best existing SOG installation or architectural glass image. Add a deep navy gradient so text remains readable.
- Eyebrow: `Custom Glass & Aluminum Systems`
- Main headline, split into large editorial lines:

  `Built Clear.`  
  `Framed Strong.`

- Supporting copy: `Custom windows, doors, partitions, and glass systems—measured precisely, fabricated locally, and installed with care.`
- Primary CTA: `Get a Free Quote` → `/get-quote`
- Secondary CTA: `Explore Products` → `/products`
- Trust line: `Free on-site inspection · Itemized quotation · Custom fabrication`
- Add one restrained glass card showing the simple journey: `Measure → Quote → Fabricate → Install`.
- Add a second small project/product card only if it uses real product data or a real existing asset.

Reveal the hero headline by line or word with clipped upward motion after the first paint. Do not add a mandatory 1.4-second loader. If a brand intro is used at all, keep it under 500ms, show it once per session, and make it instant under reduced motion.

## 3. Trust / value proposition

Turn the reference's coach carousel into a value-led architectural section.

- Eyebrow: `Why SOG`
- Heading: `From rough opening to finished installation.`
- Body: explain the single-team workflow and reduction in measurement and coordination errors.
- Feature card copy should be based on the established project language:
  - `See it in your space` — AR-assisted visualisation where supported
  - `Measured on site` — precise dimensions from SOG technicians
  - `Quoted clearly` — itemised scope before fabrication
  - `Installed properly` — coordinated fabrication and fitting
- Use a central tilted image card only if the composition remains readable on mobile. Prefer a real measurement or installation photo from `public/images/landing`.
- A carousel is optional. If used, it should communicate real capabilities, not fictional team members.

## 4. Services

Create a high-impact numbered service list on a soft grey-blue background.

Heading:

`Made for every opening.`

Rows:

1. `Sliding Doors & Windows` — space-saving aluminum systems for homes and commercial interiors.
2. `Swing & Frameless Doors` — clean entrances with tempered-glass options.
3. `Glass Partitions` — bright, modern dividers for offices and residential spaces.
4. `Custom Cabinets & Enclosures` — made-to-measure glass and aluminum fabrication.
5. `Repair & Replacement` — assessment and replacement for damaged panels, hardware, and frames.

Each row has a concise description and an arrow linking to `/products` or `/get-quote` as appropriate. Use fine dividers, large type, subtle row hover, and a directional arrow animation. On touch devices, the interaction must remain clear without hover.

## 5. Featured installations / capabilities

Replace the tennis court cards with two or three architectural project cards using real repository assets.

- Intro heading: `Precision you can see.`
- Intro copy: `From first measurement to final alignment, every detail is checked for fit, finish, and everyday use.`
- Suggested cards:
  - `Residential Openings` — windows and doors designed around light, airflow, and security.
  - `Commercial Partitions` — clean glass divisions that keep workspaces bright.
  - `Custom Fabrication` — tailored frames, panels, finishes, and hardware.
- Use overlapping or staggered portrait cards with restrained rotation, large radii, and legible glass captions.
- Images lift/scale very slightly on hover; captions remain visible without hover.

## 6. Process band

Use a deep navy rounded section to explain the workflow.

Eyebrow: `How it works`

Heading:

`Measured once.`  
`Handled end to end.`

Four steps:

1. `Choose or describe` — browse products or tell SOG what the space needs.
2. `Measure` — schedule the free on-site inspection and confirm dimensions.
3. `Approve` — review the itemised quotation, material, finish, and schedule.
4. `Fabricate & install` — SOG prepares the system and coordinates installation.

Present steps as a responsive grid or horizontal timeline. Animate the connecting line only when it enters view. Under reduced motion, show the completed line immediately.

## 7. Products

Retain the real dynamic product integration already used by the landing page.

- Eyebrow: `Our products`
- Heading: `Built to your exact specs.`
- Fetch active products through the existing API helper and existing product types/utilities.
- Show product image, category, product name, short description, starting price/unit when available, `View Product`, and `Get Quote`.
- Keep existing query-string behaviour for `/get-quote?product={id}`.
- Use loading skeletons and a graceful empty/error state.
- Provide a `View All Products` link to `/products`.
- Do not hardcode product IDs, inventory, names, variants, or pricing.

## 8. Statistics

Only show figures that already exist in approved repository copy or live data. The current approved set may include:

- `500+` completed installations
- `100%` free on-site inspection
- `AR Ready` visualisation capability
- `5 stars` for craftsmanship, speed, and support

If these cannot be verified from existing approved content, replace the section with non-numeric proof points rather than inventing numbers. Present the content in a four-column navy band with top borders and oversized values.

## 9. FAQ

Use an accessible single-open accordion. Retain and polish the existing factual questions:

- What types of glass do you use?
- How long does fabrication and installation take?
- Is the on-site inspection free?
- Which areas do you service?
- How does the AR preview work?

Buttons must use `aria-expanded` and `aria-controls`. Animate height and opacity with Framer Motion, but keep content accessible without animation.

## 10. Booking and quote CTA

Reuse the existing booking component and real submission behaviour instead of introducing a stub modal.

- Eyebrow: `Start your project`
- Heading: `Ready for a clearer plan?`
- Copy: `Tell us what you need or schedule a free on-site inspection. We’ll confirm the details before anything is fabricated.`
- Primary CTA: `Build My Quote` → `/get-quote`
- Secondary CTA: `Book an Inspection` → `#booking`
- Preserve validation, consent language, API integration, loading, success, and error states.

## 11. Footer

Create a deep navy rounded footer with a strong CTA and the existing SOG contact details.

- Brand: `SOG Glass & Aluminum Services`
- Blurb: `Crafted with precision. Built to last. Designed to impress.`
- Link groups: Products, Services, Company, Customer
- Customer links should include `/get-quote`, `/track`, and account access where already supported.
- Use real contact details and service location from the existing codebase.
- Copyright: `© 2026 SOG Glass & Aluminum Services. All rights reserved.`
- Do not add social links unless valid URLs already exist.

## Motion system

Use a restrained shared motion system rather than ad-hoc animations:

```ts
const easeOut = [0.16, 1, 0.3, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const viewport = { once: true, amount: 0.2 };
```

- Headline clip reveals: `0.8–1.0s`, stagger `0.08–0.12s`.
- Standard in-view reveals: `0.5–0.7s`, `y: 20–32`.
- Card stagger: `0.08–0.12s`.
- Hover lifts: no more than `-6px`; image scale no more than `1.03`.
- Parallax: maximum visual travel around `6%`; disable on small screens and reduced motion.
- Avoid animating layout-heavy properties each frame. Prefer transforms and opacity.
- Avoid infinite motion except an optional slow product marquee that pauses on hover/focus and is disabled under reduced motion.

## Component structure

Keep the implementation maintainable. A sensible shape is:

```text
app/page.tsx
components/landing/
  SiteHeader.tsx
  Hero.tsx
  ValueSection.tsx
  ServicesList.tsx
  ProjectShowcase.tsx
  ProcessSection.tsx
  ProductGrid.tsx
  StatsBand.tsx
  FaqAccordion.tsx
  Booking.tsx
  Footer.tsx
  motion.ts
```

Reuse existing landing, quote, product, and UI components when they already meet the need. Refactor rather than duplicating API calls or business logic. Do not create a second competing navbar, footer, booking form, or product-fetching implementation.

## Asset rules

Prefer existing local assets:

- `/images/sog-logo.png`
- `/images/landing/glass_works.jpg`
- `/images/landing/high-quality.png`
- `/images/landing/aesthetic.jpg`
- `/images/landing/workmanship.png`
- `/images/landing/measuring.jpg`
- `/images/landing/ar_door.jpg`
- `/images/landing/windows.jpg`
- `/images/landing/showcase/*`

Inspect the assets before assigning them. Match each image to truthful copy and write accurate alt text. Do not use the tennis image URLs from the reference prompt. Do not add remote stock photography unless no suitable local asset exists and the user explicitly approves it.

## Acceptance criteria

- The result clearly belongs to SOG Glass & Aluminum Services, with no tennis language or tennis imagery.
- It is a real Next.js + TypeScript + Tailwind implementation, not a single HTML file.
- Existing product, quote, booking, tracking, and API flows continue to work.
- The landing page is visually polished at mobile, tablet, laptop, and wide desktop sizes.
- No horizontal overflow, overlapping text, clipped focus rings, or unreadable image text.
- All interactive controls work with keyboard and touch.
- Reduced-motion users receive a complete, stable experience.
- Dynamic products retain loading, error, and empty states.
- No fake metrics, testimonials, team members, addresses, phone numbers, or product prices are introduced.
- Run the existing lint and production build commands and fix all issues caused by the landing-page work.

The final result should feel inspired by the reference's premium editorial composition, but unmistakably designed for a modern Philippine glass and aluminum fabrication company.
