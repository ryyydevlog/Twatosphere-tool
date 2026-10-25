# Twatos Tools

Small browser tools. No build step, no server: open `index.html` and it works. Most tools run locally; the **Live data** tools need internet because they call free public APIs (no keys or accounts).

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page shell: header, search, category chips, empty grid and an empty workbench |
| `style.css` | All styling. Colors are CSS variables at the top (black and white theme, slow background drift, respects reduced-motion) |
| `core.js` | Shared helpers (`$`, `secureInt`, `pick`, `copyText`, `download`), builds cards and panels from the tools, router, search and filters |
| `tools-api.js` | Live tools that call free public APIs: Weather Peek, Money Swapper, Word Detective, Country Cards, Dog Finder |
| `tools-make.js` | QR Maker, Password Blender, Palette Roulette, Focus Timer |
| `tools-convert.js` | Image Flipper, Word Counter, Case Converter |
| `tools-fun.js` | Dice Tumbler, Name Picker |

## How it works

Each tool registers itself with `(window.TOOLS ||= []).push({ id, title, emoji, desc, cat, kw, html, init })`.
`core.js` turns that list into home-page cards and hidden panels. The URL hash picks the tool
(`index.html#qr`), and `init()` runs once, the first time a tool opens.

## Adding a tool

1. Copy any block in a `tools-*.js` file (pick the one matching its category: `make`, `convert` or `fun`).
2. Change `id`, `title`, `emoji`, `desc`, `kw` (hidden search words), `html` and the code in `init()`.
3. Element ids inside a tool should start with the tool id (e.g. `qr-text`) so tools never clash.
That is all: the card, search, filter and routing are automatic.

## API tools

| Tool | Service | Notes |
| --- | --- | --- |
| Weather Peek | Open-Meteo (geocoding + forecast) | No key, CORS enabled |
| Money Swapper | Frankfurter (ECB daily rates) | Rates change on working days only |
| Word Detective | Free Dictionary API | English only; a 404 means word not found |
| Country Cards | REST Countries v3.1 | Uses the `fields` filter to keep responses small |
| Dog Finder | Dog CEO | Top-level breeds only |

Each tool ignores out-of-date responses (so fast typing cannot show an old result) and shows a friendly message if the network or service fails.
Free services can change or go down; if one breaks, only that tool is affected. If you open `index.html` straight from disk and a browser blocks requests, serve the folder instead (`python3 -m http.server`).
