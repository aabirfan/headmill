<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/img/logo.svg"/>
  <img src="assets/img/logo-dark.svg" alt="Headmill Capital" width="260"/>
</picture>

### **We Value You**

**The marketing site for Headmill Capital** — an independent, whole-of-market
UK mortgage & insurance broker.

Five pages. Zero dependencies. No build step. No framework.
Just HTML, CSS and a few hundred lines of vanilla JavaScript that know exactly what they're for.

<br/>

`🌲 Forest #4A6B2F` &nbsp;·&nbsp; `🌾 Cream #F0E9C2` &nbsp;·&nbsp; `🖋 Ink #1F2A1A` &nbsp;·&nbsp; `Figtree`

[**headmill.co.uk**](https://www.headmill.co.uk/) &nbsp;·&nbsp; FCA 967489

</div>

---

## The short version

Twenty years inside NatWest, Barclays and the rest — then out, and on the client's side
instead. This repo is the shop window for that: a fast, quiet, accessible site that explains
what Headmill does and gets an enquiry into an inbox without ceremony.

There is no `package.json` here, and that's deliberate. Open `index.html` in a browser and
the whole thing works. Deploy it by copying the folder onto a static host. The heaviest
thing on the page is a photograph.

---

## What's in the box

```
headmill/
├── index.html          Home — hero, lender marquee, services, stats, about, reviews, contact
├── mortgages.html      First-time buyers, remortgage, buy-to-let  +  live repayment calculator
├── protection.html     Life, critical illness, income protection
├── commercial.html     Commercial & specialist lending
├── privacy.html        The legally required reading
│
└── assets/
    ├── css/
    │   ├── base.css        Design tokens, reset, buttons, nav, footer, forms, FAQ, cookies
    │   ├── home.css        Home-page-only layout
    │   ├── service.css     Shared by the three service pages
    │   └── privacy.css     Long-form prose
    ├── js/
    │   ├── shared.js       Hamburger menu + cookie banner  (every page)
    │   ├── form.js         Contact form: validation → Formspree
    │   ├── lenders.js      The drifting lender logo marquee
    │   └── calculator.js   Mortgage maths            (mortgages.html only)
    └── img/
        ├── lenders/        10 lender marks — Barclays, HSBC, Halifax, Lloyds,
        │                   Nationwide, NatWest, Santander, Virgin Money, Coventry, Accord
        └── *.jpg           Unsplash photography — see CREDITS.txt
```

Every page loads `base.css` plus exactly one page-specific stylesheet, and only the scripts
it actually uses. `mortgages.html` is the only page that pays for the calculator.

---

## The four scripts, and what each one earns

**`lenders.js` — the marquee that behaves.**
The logo track holds two identical sets of logos, so the offset can wrap modulo one
set-width and never show a seam. It drifts left at 24px/s, pauses on hover, glides 260px
per arrow press, waits four seconds after you stop poking it, then resumes.
`prefers-reduced-motion` stops the drift entirely.

**`calculator.js` — no lies about money.**
Standard amortising repayment formula, `M = P·r(1+r)ⁿ / ((1+r)ⁿ−1)`, with a zero-rate
branch so a 0% input divides cleanly instead of returning `NaN`. Recalculates on every
keystroke; returns em-dashes rather than nonsense when the inputs don't make sense.
Also reports LTV, because that's the number that decides the rate.

**`form.js` — validate first, then travel.**
Field-level errors appear inline next to the offending input, not as a wall of red at the
top. Only once everything passes does anything cross the network — a `POST` to Formspree.

**`shared.js` — the small civilised things.**
Hamburger toggle with real `aria-expanded` state, body scroll lock while open, Escape to
close. Cookie banner that appears after 900ms and remembers your answer in `localStorage`
under `hm_cookies`.

---

## Design notes

Everything visual routes through custom properties in the `:root` block at the top of
`base.css`. Change `--forest` there and the entire site changes with it — buttons, badges,
hero circles, focus rings, the lot. There are no hard-coded hex values scattered through
the page CSS.

The palette is deliberately unbanky: forest green and cream rather than corporate navy and
white. Rounded 16px cards, pill buttons, soft low-opacity shadows built from the ink colour
rather than pure black, so nothing looks like it's floating on a different page.

Accessibility isn't bolted on: `aria-label` on every icon-only control, `aria-expanded` that
tracks reality, `alt` text that describes rather than repeats, `loading="lazy"` and explicit
`width`/`height` on every image so nothing shifts as the page settles.

---

## Running it

```bash
git clone https://github.com/aabirfan/headmill.git
cd headmill
open index.html          # genuinely, that's it
```

For relative paths and `localStorage` to behave exactly as they do in production, serve it:

```bash
python3 -m http.server 8000   # → http://localhost:8000
```

**Deploying:** upload the repo. Any static host — GitHub Pages, Netlify, Cloudflare Pages,
a bare S3 bucket, a folder on shared hosting. There is nothing to compile.

**One gotcha:** stylesheets and scripts are cache-busted by hand with query strings
(`base.css?v=2`, `lenders.js?v=2`). Edit a file, bump its `?v=` in every page that links
it, or returning visitors keep the old one.

---

## Making changes

| You want to… | Go here |
|---|---|
| Change the brand colour, radius or shadow | `:root` in `assets/css/base.css` |
| Edit nav, footer or the FCA disclosure | Every `.html` — they're duplicated, not templated |
| Add a lender logo | `assets/img/lenders/` + **both** copies of the track in `index.html` |
| Point the contact form elsewhere | The `fetch()` URL in `assets/js/form.js` |
| Adjust marquee speed or step | The `SPEED` / `STEP` / `RESUME_MS` constants in `lenders.js` |
| Add a page | Copy a service page, swap `service.css` for your own, keep the nav in sync |

No templating engine means the nav and footer live in five places. It's the honest trade for
having no build step — when you touch one, touch all five.

---

## Credits & compliance

Photography from Unsplash under the Unsplash License; source photo IDs are logged in
`assets/img/CREDITS.txt` so any image can be traced back to its photographer. `green-door.jpg`
is © Ben Prater per its embedded EXIF.

> Your home may be repossessed if you do not keep up repayments on your mortgage.
> Headmill Capital Ltd is an appointed representative of Beneficial Ltd, authorised and
> regulated by the Financial Conduct Authority (FCA 736655). Headmill Capital Ltd is
> authorised and regulated by the Financial Conduct Authority (FCA 967489).

<div align="center">
<br/>

**© 2026 Headmill Capital Ltd**

</div>
