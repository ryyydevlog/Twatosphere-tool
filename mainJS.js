
/* ============================================================
   6. JAVASCRIPT
   No frameworks. Helpers first, then one section per tool.
   ============================================================ */

/* Tiny shortcut so we can write $("id") instead of document.getElementById("id") */
const $ = (id) => document.getElementById(id);

/* Pick a random item from an array */
const pick = (list) => list[Math.floor(Math.random() * list.length)];

/* ---------- TOOL SWITCHING ----------
   1. Find every card button and every panel.
   2. When a card is clicked, hide all panels, then show the matching one.
   3. Mark the clicked card with aria-pressed="true" (CSS turns it lime). */
const cards  = document.querySelectorAll(".tool-card");
const panels = document.querySelectorAll(".tool-panel");

function openTool(name) {
  panels.forEach((p) => { p.hidden = p.id !== "panel-" + name; });   // only the matching panel stays visible
  cards.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.tool === name)));
  $("bench").focus({ preventScroll: true });
  $("bench").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
cards.forEach((c) => c.addEventListener("click", () => openTool(c.dataset.tool)));

/* ---------- TOOL 1: QR CODE ----------
   The qrcode.js library takes a container element and some options,
   then draws the code inside it. We clear the box first so old codes vanish. */
$("qr-go").addEventListener("click", () => {
  const text = $("qr-text").value.trim();
  const box = $("qr-out");
  if (!text) { box.textContent = "Type something first, then press the button."; return; }
  if (typeof QRCode === "undefined") { box.textContent = "The QR library did not load. Check your connection and reload."; return; }
  box.innerHTML = "";                       // remove the previous code
  new QRCode(box, { text, width: 220, height: 220, colorDark: "#1b1340", colorLight: "#ffffff" });
});

/* ---------- TOOL 2: IMAGE CONVERTER ----------
   Steps: read the file -> draw it on an invisible canvas -> ask the canvas
   to export itself in the chosen format -> show the result as an <img>.
   Everything happens locally; the file never leaves the device. */
$("img-go").addEventListener("click", () => {
  const file = $("img-file").files[0];
  const out = $("img-out");
  if (!file) { out.textContent = "Choose an image file first."; return; }

  const url = URL.createObjectURL(file);    // a temporary local link to the file
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";                 // JPG has no transparency, so paint white behind it
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);               // free the temporary link
    // 0.92 = quality for JPG and WebP (PNG ignores it)
    canvas.toBlob((blob) => {
      out.innerHTML = "";
      const result = document.createElement("img");
      result.src = URL.createObjectURL(blob);
      result.alt = "Converted image";
      out.appendChild(result);
    }, $("img-fmt").value, 0.92);
  };
  img.onerror = () => { out.textContent = "That file could not be read as an image."; };
  img.src = url;
});

/* ---------- TOOL 3: MOCKING TEXT ----------
   Walk through each character. Letters alternate lower / UPPER;
   spaces and symbols are kept but do not advance the counter. */
function mockify(text) {
  let isUpper = false;
  return [...text].map((ch) => {
    if (!/[a-z]/i.test(ch)) return ch;      // not a letter: leave it alone
    isUpper = !isUpper;                     // flip between lower and upper
    return isUpper ? ch.toLowerCase() : ch.toUpperCase();
  }).join("");
}
const mockIn = $("mock-in");
const renderMock = () => { $("mock-out").textContent = mockify(mockIn.value); };
mockIn.addEventListener("input", renderMock);   // "input" fires on every keystroke
renderMock();                                    // run once so the box isn't empty

/* ---------- TOOL 4: FATE BALL ----------
   Just a list of answers. Add your own lines to make it funnier. */
const answers = [
  "Yes, obviously", "Absolutely not", "Ask again after lunch", "The stars shrug",
  "Bold of you to ask", "Only on a Tuesday", "My sources say snacks", "100% maybe"
];
$("ball-go").addEventListener("click", () => {
  const ball = $("ball-out");
  ball.classList.remove("shake");
  void ball.offsetWidth;                    // forces the browser to restart the animation
  ball.classList.add("shake");
  ball.textContent = pick(answers);
});

/* ---------- TOOL 5: EXCUSE MACHINE ----------
   Mix-and-match: one random piece from each list builds a sentence.
   3 lists with 5 items each gives 125 different excuses. */
const who   = ["My cat", "A very confident pigeon", "The elevator", "My neighbour", "My phone"];
const did   = ["unplugged", "held a meeting about", "hid", "tried to negotiate with", "stood on"];
const thing = ["my alarm clock", "my car keys", "the front door", "my left shoe", "the whole morning"];
$("excuse-go").addEventListener("click", () => {
  $("excuse-out").textContent = pick(who) + " " + pick(did) + " " + pick(thing) + ".";
});

/* ============================================================
   NEW TOOLS
   ============================================================ */

/* ---------- PASSWORD BLENDER ----------
   crypto.getRandomValues fills an array with secure random numbers.
   We use each number to pick one character from the list. */
const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*?";
$("pass-len").addEventListener("input", (e) => { $("pass-len-val").textContent = e.target.value; });
$("pass-go").addEventListener("click", () => {
  const nums = crypto.getRandomValues(new Uint32Array(+$("pass-len").value));
  $("pass-out").textContent = [...nums].map((n) => chars[n % chars.length]).join("");
});
$("pass-copy").addEventListener("click", async () => {
  const text = $("pass-out").textContent;
  try { await navigator.clipboard.writeText(text); $("pass-copy").textContent = "Copied!"; }
  catch (e) { $("pass-copy").textContent = "Select and copy by hand"; }   // clipboard can be blocked in some viewers
  setTimeout(() => { $("pass-copy").textContent = "Copy"; }, 1500);
});

/* ---------- DICE TUMBLER ----------
   The six Unicode dice faces live in one string. We flicker random faces
   for ~0.5 seconds (setInterval), then show the final roll. */
const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
$("dice-go").addEventListener("click", () => {
  const count = +$("dice-n").value;
  const roll = () => Array.from({ length: count }, () => Math.floor(Math.random() * 6));
  let ticks = 0;
  const timer = setInterval(() => {
    const r = roll();
    $("dice-out").textContent = r.map((i) => faces[i]).join(" ");
    if (++ticks >= 8) {                      // last tick: show the total
      clearInterval(timer);
      $("dice-total").textContent = "Total: " + r.reduce((sum, i) => sum + i + 1, 0);
    }
  }, 60);
});

/* ---------- PALETTE ROULETTE ----------
   Random hue (0-360) with fixed saturation/lightness keeps colors pleasant.
   Hex is calculated so we can show a code. Label color flips to stay readable. */
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return "#" + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function spin() {
  const box = $("palette-out");
  box.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const l = 45 + Math.random() * 30;       // lightness 45-75%
    const hex = hslToHex(Math.random() * 360, 70, l);
    const d = document.createElement("div");
    d.className = "swatch";
    d.style.background = hex;
    d.style.color = l > 60 ? "#1b1340" : "#fff";
    d.textContent = hex.toUpperCase();
    box.appendChild(d);
  }
}
$("palette-go").addEventListener("click", spin);
spin();

/* ---------- WORD COUNTER ----------
   split(/\s+/) cuts on any whitespace; filter(Boolean) drops empty pieces.
   Reading time assumes about 200 words per minute. */
function countWords() {
  const t = $("words-in").value;
  const words = t.split(/\s+/).filter(Boolean).length;
  const sentences = (t.match(/[.!?]+/g) || []).length;
  const mins = Math.max(words ? 1 : 0, Math.round(words / 200));
  const stat = (n, label) => "<div class='stat'><b>" + n + "</b>" + label + "</div>";
  $("words-out").innerHTML = stat(words, "words") + stat(t.length, "characters") + stat(sentences, "sentences") + stat(mins, "min to read");
}
$("words-in").addEventListener("input", countWords);
countWords();

/* ============================================================
   SEARCH AND CATEGORY FILTER
   Every tool gets a category plus hidden keywords, so searching
   "color" finds Palette Roulette even though the card says "colors".
   ============================================================ */
const meta = {
  qr: ["make", "code link scan url"], img: ["convert", "file png jpg webp photo picture"],
  mock: ["fun", "text sarcasm spongebob"], ball: ["fun", "8 ball decide answer"],
  excuse: ["fun", "late lie"], pass: ["make", "secure random generator"],
  dice: ["fun", "roll game random"], palette: ["make", "color colour design hex"],
  words: ["convert", "count text length characters"]
};
let activeCat = "all";
function applyFilter() {
  const q = $("search").value.trim().toLowerCase();
  let shown = 0;
  cards.forEach((c) => {
    const [cat, keywords] = meta[c.dataset.tool];
    const haystack = (c.textContent + " " + cat + " " + keywords).toLowerCase();
    const match = (activeCat === "all" || cat === activeCat) && haystack.includes(q);
    c.hidden = !match;                       // hide non-matches
    if (match) shown++;
  });
  $("count").textContent = shown + (shown === 1 ? " tool" : " tools") + " in the pile";
  $("empty").hidden = shown !== 0;
}
$("search").addEventListener("input", applyFilter);
/* Pressing Enter in the search box opens the first tool that is still visible */
$("search").addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const first = [...cards].find((c) => !c.hidden);
  if (first) openTool(first.dataset.tool);
});
$("chips").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  activeCat = chip.dataset.cat;
  document.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
  applyFilter();
});
/* Keyboard shortcut: press "/" anywhere (outside a text box) to jump to search */
document.addEventListener("keydown", (e) => {
  const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);
  if (e.key === "/" && !typing) { e.preventDefault(); $("search").focus(); }
});
applyFilter();

/* ============================================================
   EMOJI BURST
   Clicking any big button throws 6 emojis outward. Each one gets
   a random direction through CSS variables, then removes itself.
   ============================================================ */
function burst(x, y) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;   // skip for people who prefer less motion
  for (let i = 0; i < 6; i++) {
    const s = document.createElement("span");
    s.className = "pop";
    s.textContent = pick(["✨", "⭐", "💥", "🎉", "🌈"]);
    s.style.left = x + "px"; s.style.top = y + "px";
    s.style.setProperty("--dx", (Math.random() * 160 - 80) + "px");
    s.style.setProperty("--dy", (-40 - Math.random() * 90) + "px");
    s.style.setProperty("--r", (Math.random() * 360 - 180) + "deg");
    s.addEventListener("animationend", () => s.remove());
    document.body.appendChild(s);
  }
}
document.addEventListener("click", (e) => {
  if (e.target.closest(".btn")) burst(e.clientX, e.clientY);
});

/* ---------- THEME TOGGLE ----------
   Sets data-theme on <html>; the CSS at the top reacts to it. */
$("theme-btn").addEventListener("click", () => {
  const root = document.documentElement;
  const isDark = getComputedStyle(root).colorScheme === "dark";
  root.setAttribute("data-theme", isDark ? "light" : "dark");
});
