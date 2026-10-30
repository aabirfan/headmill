# Headmill Capital business card

Redesign for Aariz Irfan, PRIMIS stationery register **1460537**, assessment dated **17 September 2026**. Both sides are landscape, **85 × 55 mm** at trim. The supplied assessment and card photos were read without changing them. Website files were not changed.

## Files

| File | Purpose |
| --- | --- |
| `front.svg`, `back.svg` | Editable text and vector artwork, including 3 mm bleed. Figtree is embedded in each SVG for browser display. |
| `front-outlined.svg`, `back-outlined.svg` | Font-independent vector artwork with all lettering converted to paths. |
| `headmill-business-card-print.pdf` | Two print pages, front first and back second; outlined lettering, 3 mm bleed, crop marks and explicit PDF boxes. |
| `front.png`, `back.png` | Trimmed 600 dpi PNGs rendered from the final PDF for resubmission. |
| `both-sides.png` | Combined front/back contact sheet, with labels outside the card artwork. |
| `proof.html` | Portable, self-contained page showing both final PNG proofs. |
| `preflight.json` | Generated dimensions, wording checks, type sizes and measured text bounds. |
| `build.py`, `requirements.txt` | Reproducible artwork, export and verification pipeline. |
| `assets/`, `fonts/` | Reusable vector marks and the Figtree font with its licence. |

## Assessment mapping

| Assessment point | Result in this redesign |
| --- | --- |
| Statutory status disclosure — failed | The entire superseded third-party disclosure and its reference number have been removed. The back contains the exact PRIMIS replacement wording below. |
| Trading address — failed | The full supplied trading address is on the back, including the suite, building, street and postcode. |
| Company registration — failed | The back states the company number and registration jurisdiction exactly as supplied. |
| Contact details — passed | Aariz Irfan, the exact job title, telephone number and email address are retained on the front. |
| Email domain — passed | `a.irfan@headmill.co.uk` is retained. |
| Logo/branding — passed | The website's round H mark is used with HEADMILL CAPITAL and the exact tagline `We Value you`. |
| Website link — passed | `www.headmill.co.uk` is retained. |
| Social profile — passed | `@Headmillcapital` is retained, with the current X mark replacing the bird. |
| Promotional content / email disclaimer — N/A | No additional promotional claims or email disclaimer were added. |

The FCA logo is removed. The WhatsApp symbol accompanies the telephone number. The ICO Registered badge is retained in navy and white, recreated as vector artwork from the supplied photo, with its caption enlarged to 6 pt. This badge is a visual reconstruction, not an original master asset.

The assessment separately asks for website and social profile approval. This card package addresses the stationery corrections; it does not claim a new PRIMIS approval for the card, website or social profile.

## Exact back copy

Headmill Capital Ltd is an Appointed Representative of PRIMIS Mortgage Network, a trading name of First Complete Ltd. First Complete Ltd is authorised and regulated by the Financial Conduct Authority.

Company number 13357642, registered in England & Wales.

Trading address: Suite 401-403, Cumberland House, 80 Scrubs Lane, London NW10 6RF

## Website styling and production

The live website and repository `assets/css/base.css` agree on these tokens: forest `#4A6B2F`, pine `#3D5A26`, cream `#F0E9C2`, cream-light `#F8F5E6`, and ink `#1F2A1A`. The front uses cream-light and ink with forest accents; the back uses forest, white text and cream branding. Typography is Figtree, as on the website. The Georgia H uses the circle, letter size and baseline geometry in `assets/img/logo.svg` / `logo-dark.svg`, converted to a reusable path.

All text is at least **6 pt**; the back copy is **7.5 pt**. The layout starts at 4.5 mm from trim, and the preflight reports the actual minimum lettering inset (over 4 mm). Back text is solid white on forest green; no text sits on a decorative image. The vector ICO caption is 6 pt. Lettering uses fixed advances in both editable and outlined exports for consistent placement.

The PDF MediaBox is **97 × 67 mm**, allowing space for marks. Its TrimBox is **85 × 55 mm**, inset 6 mm from the media edge. The BleedBox is **91 × 61 mm**, inset 3 mm from the media edge. Backgrounds extend through that full bleed. Crop marks are 0.25 pt and sit outside the bleed, aligned to trim. Both pages are supplied upright; the printer can impose them to suit its duplex process. Print at 100% scale using the TrimBox. The PDF uses the website's RGB colours and contains vector paths throughout, with no font dependency.

## Regenerate

Python 3.9 or newer is sufficient. From the repository root:

```sh
python3 -m venv /tmp/headmill-card-venv
/tmp/headmill-card-venv/bin/pip install -r work/business-card/requirements.txt
/tmp/headmill-card-venv/bin/python work/business-card/build.py
```

Edit the content and layout in `build.py` for repeatable changes, then run the last command again. It regenerates the editable SVGs as well as the exports, so preserve any separate manual SVG edits before running it. The SVGs can also be opened directly in a vector editor; install `fonts/Figtree-Variable.ttf` if that editor does not support embedded SVG fonts. All source assets needed by the build are included; it makes no network requests and requires no system fonts or browser installation.

The build verifies the three exact back paragraphs, required front strings, minimum type size, glyph bounds within the 3 mm safe zone, two PDF pages, trim/bleed dimensions and absence of font resources in the outlined PDF. The 600 dpi side PNGs are rendered from the final PDF, then assembled into the combined image. Inspect the latest PNGs after any edit.

Figtree comes from the [Google Fonts source](https://github.com/google/fonts/tree/main/ofl/figtree); the supplied `fonts/OFL.txt` must remain with the font. The H and badge letterforms are supplied as vector outlines, so their original system fonts are not needed to regenerate.

## Visual review

The final PDF renders were checked for alignment, overflow, contrast, all three disclosure paragraphs, contact details, the X mark, the ICO caption and safe-zone clearance. The full print page was also checked for the bleed extent and crop-mark position. Final measured values are recorded in `preflight.json`.
