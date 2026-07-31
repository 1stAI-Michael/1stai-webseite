# Brand fonts

Vendored on purpose: `scripts/blog-assets.mjs` embeds these as data URIs, so
image rendering is byte-stable and works without network access. Fetching them
from Google Fonts at render time would make the output depend on an external
service.

| File | Family | Source | Licence |
|---|---|---|---|
| `SpaceGrotesk-latin-ext.woff2` | Space Grotesk (variable, wght 300–700) | Google Fonts, latin-ext subset | SIL Open Font License 1.1 |
| `Manrope-latin-ext.woff2` | Manrope (variable, wght 200–800) | Google Fonts, latin-ext subset | SIL Open Font License 1.1 |

Both subsets include Latin Extended, which the Polish characters (ąćęłńóśźż)
in addresses and legal text require.

The OFL permits redistribution as part of a software package; the licence text
is in `OFL.txt`. Copyright holders per upstream: Space Grotesk by Florian
Karsten, Manrope by Mikhail Sharanda.

To refresh a subset, request the CSS from Google Fonts with a current browser
user agent, take the `latin-ext` `@font-face` URL and download the woff2.
