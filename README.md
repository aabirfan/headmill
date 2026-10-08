# Headmill Capital

The marketing website for an independent UK mortgage and insurance adviser.
Five static pages, vanilla JavaScript, and no build step or dependencies.

## Design

A warm, editorial identity for homebuyers, homeowners, landlords, and business
borrowers: deep green (`#284638`), ivory (`#F7F3EA`), and sage (`#DDE5D8`).
Lora provides the display typography; Figtree keeps body copy and controls clear.

The homepage combines a split photographic hero, an early client testimonial,
starting points for different borrowers, an introduction to Irfan, varied service
features, a three-step process, client reviews, and a callback form.
The adviser introduction uses a brand monogram; an authentic adviser portrait can
replace it when one is available.

## Run locally

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Deploy by copying the files to a static host.

## Files

- `index.html` — homepage.
- `mortgages.html` — residential mortgage services and repayment calculator.
- `protection.html` — life, critical illness, and income protection.
- `commercial.html` — commercial and specialist property lending.
- `privacy.html` — privacy policy.
- `assets/css/base.css` — shared tokens, navigation, typography, forms, and footer.
- `assets/css/home.css` — homepage composition and responsive layouts.
- `assets/css/service.css` — service pages and calculator layout.
- `assets/css/privacy.css` — long-form policy layout.
- `assets/js/motion.js` — spring and gesture helpers.
- `assets/js/shared.js` — mobile navigation, scroll effects, and cookie notice.
- `assets/js/form.js` — callback validation and Formspree submission.
- `assets/js/lenders.js` — draggable lender strip.
- `assets/js/calculator.js` — mortgage repayment estimates.

## Interaction and accessibility

Mobile navigation supports keyboard focus, Escape dismissal, and interruptible
gesture motion. Skip links, a main content landmark, inline field errors, and
reduced-motion, reduced-transparency, and higher-contrast preferences are included.
Content remains visible when JavaScript is unavailable.

Callback requests require a name, phone number, and service choice. Email and
additional details are optional. Borrower starting points link to the relevant
mortgage section and preselect that service in the callback form. Requests go to
the existing Formspree endpoint in `assets/js/form.js`.

Only the initial consultation is described as free. Keep the existing disclosures
and verify business claims, fees, response times, and testimonials when changing
copy. The calculator provides illustrative repayment figures rather than an offer.

## Editing

Shared design values live in `:root` in `assets/css/base.css`. Navigation, forms,
and footers are repeated across the HTML files, so shared changes should be
applied consistently. Bump asset query-string versions in every affected page
when changing CSS or JavaScript.

Photography credits and source IDs are in `assets/img/CREDITS.txt`. Lender marks
are kept in `assets/img/lenders/`.
