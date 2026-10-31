# Twatos Tools v2.1

A heap of small, slightly silly tools that actually work. No build step, no server, no accounts: open `index.html` and go.

25 tools in four categories: **Make**, **Convert**, **Just for fun** and **Live data**.

## What's new in v2.1

- **New look.** A kraft-paper theme with one accent color per category, rotated "tag" cards, receipt-style results and a grain texture.
- **New favicon.** A toolbox with four color swatches (`icon.png`).
- **A little note for you.** A taped-paper box at the top left of the home page shows a different hopeful note every time the page opens or reloads (never the same one twice in a row), with an "Another note" button. The notes live in `notes.js`, one per line, so you can add your own.
- **Pinned tools.** Tap the star on any card (or **Pin this tool** inside a tool) to keep it at the front of the grid. A **★ Pinned** filter shows only your pins. Pins are saved in your browser only and sync between open tabs.
- **Search and filters.** Search by name or hidden keywords, filter by category chips, press `/` to jump to the search box and `Enter` to open the first match.
- **Shareable links.** Every tool has its own address (`index.html#qr`), and the back button works.
- **Live data tools.** Weather, currency, dictionary, country and dog tools that call free public APIs (no keys).
- **A much more capable QR Maker** and a new **QR Reader** that scans codes back (details below).
- **Eleven more tools.** QR Reader, Contrast Checker, JSON Formatter, Unit Converter, Base64 & URL Encoder, Receipt Maker, ASCII Banner, Noise Machine, Text Diff, Image Cropper and Decision Wheel.
- **Cleaner code.** Unused helpers and CSS from the old files were removed in the merge.
- **Built for phones.** Tested in a real browser at 320, 360 and 390 px wide, with no sideways scrolling on any page.
  - Two-column tool grid on phones (one column below 340 px) and a one-row, swipeable filter bar.
  - Finger-sized targets (44 px) for buttons, chips, links, sliders and checkbox rows on touch screens.
  - Form fields use 16 px text on touch screens, so iPhones do not zoom in when you tap them.
  - Respects notches and safe areas, has no double-tap zoom delay and stops animations when reduced motion is on.
  - Image Cropper: drag the box or its handles with a finger; swiping anywhere else still scrolls the page.
  - **Add to Home Screen:** `manifest.webmanifest` and app icons (`icon-192.png`, `icon-512.png`) let phones install it like an app, with a matching paper-colored browser bar.

## The tools

| Category | Tools |
| --- | --- |
| Make | QR Maker, QR Reader, Receipt Maker, ASCII Banner, Noise Machine, Password Blender, Palette Roulette, Contrast Checker, Focus Timer |
| Convert | Image Flipper, Image Cropper, Word Counter, Case Converter, Text Diff, JSON Formatter, Unit Converter, Base64 & URL Encoder |
| Just for fun | Dice Tumbler, Name Picker, Decision Wheel |
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

Accented letters use 2 bytes, most Asian scripts 3 and emoji 4. Only text-based files work. Photos, PDFs and zips are refused, because the numbered codes carry text only.

### QR Reader

Scans QR codes with the camera, from screenshots or photos, or from text you paste.

- **Joins numbered codes.** Codes tagged `[1/5]`, `[2/5]`... from QR Maker are collected in any order, with a live "Still needed: 2, 4" list. When the set is complete you can copy the text or download it as `scanned-text.txt`.
- **Plain codes** (links, Wi-Fi, contacts, anything without a tag) are shown as they are.
- **Camera stops by itself** when the set is complete, when you leave the tool and when you close the page.
- **Decoder:** the browser's built-in `BarcodeDetector` when it has one (no download). Otherwise `jsQR` 1.4.0 is loaded from jsDelivr, only when needed.
- The camera needs `https` or `localhost`. If it is blocked, choose images or paste the text instead.

### JSON Formatter

Validates as you type, then Format (2 spaces, 4 spaces or tab) or Minify, with optional A-Z key sorting. Errors name the line and column, show the line with a marker under the problem, and **Jump to error** selects it in the text box. It uses its own small scanner for error positions, so messages are the same in every browser. Copy or download the result. Ctrl/Cmd + Enter formats.

### Unit Converter

Length, weight, temperature, volume (US), area, speed, time and data size (both 1,000 and 1,024 based units). Shows the result, the rate and the same amount in every unit of that type. Rejects temperatures below absolute zero.

### Base64 & URL Encoder

Base64 encode and decode (UTF-8 text, URL-safe option, optional padding, `data:` prefix), URL encode (a piece of a URL or a whole URL) and URL decode (optional "+ is a space"). Choose a file up to 2 MB to turn it into Base64, and download binary Base64 back as a file. "Use result as input" flips the direction.

### Contrast Checker

Pick or type two colors (`#rgb` or `#rrggbb`). Shows the WCAG ratio, pass or fail for normal text, large text and icons at AA and AAA, a live sample, and a suggested text color when normal text fails AA. Ratios are rounded down, so 4.499 never shows as a passing 4.50.

### Receipt Maker

Design a thermal-paper receipt: store name, address lines, date, receipt number, up to 30 items (name, quantity, price), currency symbol, tax rate and a closing message, with an optional barcode. Totals are worked out in whole cents, so there are no rounding surprises. Torn paper edges are drawn on a canvas and **Download PNG** saves it at 2x or 3x size with transparent corners. It is for fun, props and mockups, not a proof of purchase.

### ASCII Banner

Turns up to four lines of text into big block letters using a built-in 5x7 pixel font (A-Z, 0-9 and common punctuation; anything else shows as `?`). Pick the fill character (or your own), three sizes, left/center/right alignment and wrapping at 40 to 120 columns. Frames: double or single line box, plain ASCII box, hash border, `/* */` block comment, `//` or `#` line comments. Copy or download as `banner.txt`.

### Noise Machine

Pink, brown and white noise plus binaural tones, all made live with the Web Audio API (no audio files). Noise is generated as ten seconds of stereo sound blended at the loop point, so it repeats without a click, and every sound is set to the same loudness. Binaural mode has delta, theta, alpha and beta targets and an adjustable base tone, and needs headphones. Volume starts at 30%, and a stop timer (15, 30 or 60 minutes) fades the sound out. The sound keeps playing when you open another tool, so it works alongside Focus Timer.

### Text Diff

Compares two texts line by line with a longest-common-subsequence diff. Added lines are green with `+`, removed lines are red with `−` (so color is never the only clue), and the words that changed inside a replaced line are marked. Options: ignore extra spaces, ignore capitals, and hide long unchanged stretches (keeps 2 lines of context). Shows counts, can swap the two texts and copies the result as `+`/`-` text. Very large or very different texts are refused instead of freezing the page.

### Image Cropper

Choose an image and a shape (free, same as the image, 1:1, 4:3, 3:4, 3:2, 2:3, 16:9, 9:16 or 4:5), then drag the box or any of its eight handles. It works with mouse, touch and pen (larger touch targets on phones). Keyboard: focus the picture, use arrow keys to move (Shift for bigger steps) and `+` / `-` to resize. Left, top, width and height boxes give exact control. Save as PNG, JPG or WebP, with quality and an optional resize width. Exports over about 16 million pixels are blocked, because browsers cannot save them.

### Decision Wheel

Up to 40 options, one per line (add a name twice to double its chances). The winner is picked first with `crypto.getRandomValues`, then the wheel spins 4 to 7 turns and slows down smoothly to land on it, so the visual result always matches the draw. Tap the wheel or press Spin; Enter and Space work on the focused wheel. Options: remove the winner after each spin and a tick sound. If the system asks for reduced motion, the wheel jumps straight to the result. The last five winners are listed.

## Privacy

Most tools run entirely in your browser and send nothing anywhere. Only the five **Live data** tools send what you type (a city, a currency, a word, a country, a dog breed) to the service named below. Pinned tools are stored in your browser's `localStorage` (key `twatos-pins`) and never sent anywhere; clearing site data removes them. Files you pick (Image Flipper, Image Cropper, QR Maker, Base64 & URL Encoder), camera pictures (QR Reader), receipts and sounds are all processed on your device and never uploaded.

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page shell: header, search, category chips, empty grid and an empty workbench |
| `style.css` | All styling. Colors are CSS variables at the top (kraft-paper theme, one accent per tool category) |
| `core.js` | Shared helpers (`$`, `secureInt`, `copyText`, `download`), builds cards and panels from the tools, router, search and filters, pinned tools and the daily note |
| `notes.js` | The list of hopeful notes (`window.NOTES`), easy to edit |
| `icon.png` | Favicon |
| `icon-192.png`, `icon-512.png`, `manifest.webmanifest` | App icons and the web app manifest (Add to Home Screen) |
| `tools-make.js` | QR Maker, QR Reader, Receipt Maker, ASCII Banner, Noise Machine, Password Blender, Palette Roulette, Contrast Checker, Focus Timer |
| `tools-convert.js` | Image Flipper, Image Cropper, Word Counter, Case Converter, Text Diff, JSON Formatter, Unit Converter, Base64 & URL Encoder |
| `tools-fun.js` | Dice Tumbler, Name Picker, Decision Wheel |
| `tools-api.js` | Live tools: Weather Peek, Money Swapper, Word Detective, Country Cards, Dog Finder |

## How it works

Each tool registers itself with `(window.TOOLS ||= []).push({ id, title, emoji, desc, cat, kw, html, init })`.
`core.js` turns that list into home-page cards (each with a pin button) and hidden panels. The URL hash picks the tool
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

Open `index.html` in a browser. Three things can load from the internet: Google Fonts, the QR library (`qrcodejs` 1.0.0 from cdnjs) and, only for QR Reader in browsers without `BarcodeDetector`, `jsQR` 1.4.0 from jsDelivr. Without a connection the page still works with fallback fonts, but QR Maker shows a "library did not load" message. QR Reader's camera needs `https` or `localhost`, so for camera scanning use the local server below instead of opening the file from disk. If a browser blocks requests when opening the file straight from disk, serve the folder instead (`python3 -m http.server`).

## Ideas for later

- Send **binary files** (photos, PDFs) over numbered QR codes. This needs a file header in each code that only QR Reader understands.
- More tools: regex tester, timestamp converter, markdown preview.
