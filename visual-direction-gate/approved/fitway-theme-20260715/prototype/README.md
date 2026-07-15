# FITWAY full-product visual prototype

This isolated React/Vite package is the curated, review-only copy of the approved visual-lab
prototype. Its source provenance is frozen by the parent approval manifest; production
application files and product semantics remain authoritative elsewhere.

## Run locally

Install from the package's independent lockfile:

```powershell
pnpm --ignore-workspace --dir visual-direction-gate/approved/fitway-theme-20260715/prototype install --frozen-lockfile
```

Start the development server:

```powershell
pnpm --ignore-workspace --dir visual-direction-gate/approved/fitway-theme-20260715/prototype dev
```

Open:

`http://127.0.0.1:4178/visual-direction-gate/approved/fitway-theme-20260715/prototype/index.html?route=review&lang=ar`

The review index links every route and state in Arabic and English and records the nine
required viewport widths. `provenance/signal-master.source.css` is the byte-exact approved
visual-lab stylesheet. The runnable `signal-master.css` changes only font URLs so they resolve
to the package's hashed local `assets/`; the logo is local for the same immutability reason.

Create and serve the isolated production build:

```powershell
pnpm --ignore-workspace --dir visual-direction-gate/approved/fitway-theme-20260715/prototype build
pnpm --ignore-workspace --dir visual-direction-gate/approved/fitway-theme-20260715/prototype preview
```

## Query model

The prototype uses three deterministic review parameters:

| Parameter | Values | Default | Purpose |
| --- | --- | --- | --- |
| `route` | `public-live`, `staff-login`, `staff-live`, `admin-analytics`, `admin-history`, `admin-settings`, `admin-access`, `admin-audit`, `admin-health`, `review` | `public-live` | Selects the product or review route. |
| `state` | Public: `live`, `loading`, `stale`, `unavailable`, `closed`, `error`; staff login: `default`, `loading`, `error`, `rate-limit`; staff live: `live`, `stale`, `offline`, `pending`, `manual-fallback` | route-specific | Selects a deterministic route state. |
| `lang` | `ar`, `en` | `ar` | Selects Arabic/RTL or English/LTR. |

Examples:

- Arabic Public Live default: `?route=public-live&state=live&lang=ar`
- English unavailable state: `?route=public-live&state=unavailable&lang=en`
- Arabic analytics: `?route=admin-analytics&lang=ar`
- English review index: `?route=review&lang=en`

The parameters select fixed visual-review fixtures only. They do not add product
capabilities, alter access rules, or change FITWAY data meanings.
