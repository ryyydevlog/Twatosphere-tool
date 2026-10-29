# Twatos Tools v2

A heap of small, slightly silly tools that actually work. No build step, no server, no accounts: open `index.html` and go.

14 tools in four categories: **Make**, **Convert**, **Just for fun** and **Live data**.

## What's new in v2

- **New look.** A kraft-paper theme with one accent color per category, rotated "tag" cards, receipt-style results and a grain texture.
- **New favicon.** A toolbox with four color swatches (`icon.png`).
- **Search and filters.** Search by name or hidden keywords, filter by category chips, press `/` to jump to the search box and `Enter` to open the first match.
- **Shareable links.** Every tool has its own address (`index.html#qr`), and the back button works.
- **Live data tools.** Weather, currency, dictionary, country and dog tools that call free public APIs (no keys).
- **A much more capable QR Maker** (details below).
- **Cleaner code.** Unused helpers and CSS from the old files were removed in the merge.
- **Better on phones.** Edge-to-edge layout that respects notches and safe areas, and keyboard-friendly focus outlines.

## The tools

| Category | Tools |
| --- | --- |
| Make | QR Maker, Password Blender, Palette Roulette, Focus Timer |
| Convert | Image Flipper, Word Counter, Case Converter |
| Just for fun | Dice Tumbler, Name Picker |
| Live data | Weather Peek, Money Swapper, Word Detective, Country Cards, Dog Finder |

### QR Maker

| Mode | What it makes |
| --- | --- |
| Text or link | Any text or URL, updating as you type |
| Wi-Fi network | A code phones can scan to join a network (name, password, WPA/WEP/open, hidden network) |
| Contact card | A vCard with name, company, phone, email and website that phones offer to save |
| Small file | Reads a text-based file on your device and turns its contents into a code |

Other QR features:

- **Error correction** (Low, Medium, Quartile, High). Higher survives smudges, lower holds more.
- **Sizes** from Small to Huge, for dense codes.
- **Live byte counter** ("123 of 2331 bytes used") and a capacity note on the page.
- **Download PNG** with a white border (scanners need that quiet zone).
- **File splitting.** A text file too big for one code is split into up to 30 numbered codes (about 29 KB in total). Each starts with a tag like `[2/5]`, and you step through them with Previous and Next.

QR limits to know about:

| Error correction | Max bytes in one code |
| --- | --- |
| Low | 2,953 |
| Medium | 2,331 |
| Quartile | 1,663 |
| High | 1,273 |

Accented letters use 2 bytes, most Asian scripts 3 and emoji 4. Only text-based files work. Photos, PDFs and zips are refused, because a phone camera cannot rebuild a binary file from several codes.

## Privacy

Most tools run entirely in your browser and send nothing anywhere. Only the five **Live data** tools send what you type (a city, a currency, a word, a country, a dog breed) to the service named below. Files you pick in Image Flipper and QR Maker are read on your device and never uploaded.

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page shell: header, search, category chips, empty grid, empty workbench and the "About" box |
| `style.css` | All styling. Colors are CSS variables at the top (kraft-paper theme, one accent per tool category) |
| `core.js` | Shared helpers (`$`, `secureInt`, `copyText`, `download`), builds cards and panels from the tools, router, search and filters |
| `icon.png` | Favicon |
| `tools-make.js` | QR Maker, Password Blender, Palette Roulette, Focus Timer |
| `tools-convert.js` | Image Flipper, Word Counter, Case Converter |
| `tools-fun.js` | Dice Tumbler, Name Picker |
| `tools-api.js` | Live tools: Weather Peek, Money Swapper, Word Detective, Country Cards, Dog Finder |

## How it works

Each tool registers itself with `(window.TOOLS ||= []).push({ id, title, emoji, desc, cat, kw, html, init })`.
`core.js` turns that list into home-page cards and hidden panels. The URL hash picks the tool
(`index.html#qr`), and `init()` runs once, the first time a tool opens.

## Adding a tool

1. Copy any block in a `tools-*.js` file (pick the one matching its category: `make`, `convert`, `fun` or `api`).
2. Change `id`, `title`, `emoji`, `desc`, `kw` (hidden search words), `html` and the code in `init()`.
3. Element ids inside a tool should start with the tool id (e.g. `qr-text`) so tools never clash.

That is all: the card, search, filter and routing are automatic.

## Live data tools

| Tool | Service | Notes |
| --- | --- | --- |
| Weather Peek | Open-Meteo (geocoding + forecast) | No key, CORS enabled |
| Money Swapper | Frankfurter (ECB daily rates) | Rates change on working days only |
| Word Detective | Free Dictionary API | English only; a 404 means word not found |
| Country Cards | REST Countries v3.1 | Uses the `fields` filter to keep responses small |
| Dog Finder | Dog CEO | Top-level breeds only |

Each tool ignores out-of-date responses (so fast typing cannot show an old result) and shows a friendly message if the network or service fails.
Free services can change or go down; if one breaks, only that tool is affected.

## Running it

Open `index.html` in a browser. Two things load from the internet: Google Fonts and the QR library (`qrcodejs` 1.0.0 from cdnjs). Without a connection the page still works with fallback fonts, but QR Maker shows a "library did not load" message. If a browser blocks requests when opening the file straight from disk, serve the folder instead (`python3 -m http.server`).

## Ideas for later

- A QR **Receive** tab that scans split codes with the camera and rebuilds the file (this would also allow binary files).
- More tools: unit converter, color contrast checker, text diff.