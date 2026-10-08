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
    │   ├── motion.js       Springs, pointer tracking, momentum   (every page, loads first)
    │   ├── shared.js       Nav sheet, scroll edge, reveals, cookie notice  (every page)
    │   ├── form.js         Contact form: validation → Formspree
    │   ├── lenders.js      The draggable lender logo strip
    │   └── calculator.js   Mortgage maths            (mortgages.html only)
    └── img/
        ├── lenders/        10 lender marks — Barclays, HSBC, Halifax, Lloyds,
        │                   Nationwide, NatWest, Santander, Virgin Money, Coventry, Accord
        └── *.jpg           Unsplash photography — see CREDITS.txt
```

Every page loads `base.css` plus exactly one page-specific stylesheet, and only the scripts
it actually uses. `mortgages.html` is the only page that pays for the calculator.

---

## The five scripts, and what each one earns

**`motion.js` — the reason nothing here feels scripted.**
A ~200-line spring integrator plus a pointer tracker, and no dependency in sight. Springs
are parameterised the way Apple parameterises them — a damping ratio and a response time,
not mass/stiffness/damping — and every animation starts from the value currently on
screen, so anything moving can be grabbed and reversed mid-flight without jumping. It also
carries the two functions that make a flick feel physical: `project()`, which works out
where momentum would come to rest, and `rubberband()`, which resists at a boundary instead
of stopping dead. `prefers-reduced-motion` collapses every spring to an instant set.

**`lenders.js` — the strip you can throw.**
The logo track holds two identical sets, so the offset wraps modulo one set-width and
never shows a seam. It drifts at 22px/s, pauses on hover, and can be dragged 1:1 with a
finger or mouse. Let go mid-drag and it keeps going at exactly the speed you released at,
landing where the momentum was heading. The arrows re-target the same spring, so two quick
presses accelerate rather than restarting.

**`calculator.js` — no lies about money.**
Standard amortising repayment formula, `M = P·r(1+r)ⁿ / ((1+r)ⁿ−1)`, with a zero-rate
branch so a 0% input divides cleanly instead of returning `NaN`. Recalculates on every
keystroke; returns em-dashes rather than nonsense when the inputs don't make sense.
Also reports LTV, because that's the number that decides the rate.

**`form.js` — validate first, then travel.**
Field-level errors appear inline next to the offending input, not as a wall of red at the
top. Only once everything passes does anything cross the network — a `POST` to Formspree.

**`shared.js` — the small civilised things.**
The mobile navigation is a sheet, not a dropdown: it springs down from under the header,
can be dragged back up at any point — including while it is still opening — and a flick
throws it to whichever end the gesture was actually heading for. Real `aria-expanded`
state, body scroll lock while open, Escape to close, scrim to dismiss. Plus the soft edge
that fades in under the header only once content is passing beneath it, restrained section
reveals, and a cookie notice that materialises (blur and scale together) after 900ms and
remembers your answer in `localStorage` under `hm_cookies`.

---

## Design notes

Everything visual routes through custom properties in the `:root` block at the top of
`base.css`. Change `--forest` there and the entire site changes with it — buttons, badges,
hero fields, focus rings, the lot. There are no hard-coded hex values scattered through
the page CSS.

The palette is deliberately unbanky: forest green and cream rather than corporate navy and
white. Pill buttons, 20px cards and 28px panels, soft low-opacity shadows built from the
ink colour rather than pure black, so nothing looks like it's floating on a different page.

**Type is sized, tracked and led as a set.** Each step in the scale ships with the tracking
and leading that actually suit it: display type is pulled in to `-0.038em` and led at 1.03,
body sits at neutral tracking and 1.65, and small print gets a touch of positive tracking
back. A single `letter-spacing` value is always wrong somewhere.

**Chrome is a material, not a strip.** The header is translucent with the page running
underneath it, and it earns a separating edge — a soft gradient, never a 1px rule — only
once content is actually passing beneath. The nav sheet and cookie notice are the same
idea, backed by `backdrop-filter`. Note the split in the cookie markup: the wrapper owns
the transform and the surface inside owns the blur, because an element that both scales and
filters its backdrop samples that backdrop from the wrong place.

Accessibility isn't bolted on: `aria-label` on every icon-only control, `aria-expanded` that
tracks reality, `alt` text that describes rather than repeats, `loading="lazy"` and explicit
`width`/`height` on every image so nothing shifts as the page settles. Three separate user
preferences are honoured, not just the famous one — `prefers-reduced-motion` swaps travel
for cross-fades (feedback survives; only the movement goes), `prefers-reduced-transparency`
makes every translucent surface solid, and `prefers-contrast: more` firms up the text
colours and gives each surface a defined border.

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
