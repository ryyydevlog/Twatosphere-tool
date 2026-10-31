// shared helpers + tool registry + router. loads after tools-*.js so window.TOOLS is populated.

const $ = (id) => document.getElementById(id);

// rejection sampling so the result is uniform, not modulo-biased
function secureInt(max) {
  const limit = Math.floor(2 ** 32 / max) * max, a = new Uint32Array(1);
  do { crypto.getRandomValues(a); } while (a[0] >= limit);
  return a[0] % max;
}

async function copyText(text, btn) {
  const old = btn.textContent;
  try { await navigator.clipboard.writeText(text); btn.textContent = "Copied ✓"; }
  catch (e) { btn.textContent = "Select and copy by hand"; }
  setTimeout(() => { btn.textContent = old; }, 1500);
}
function download(href, name) { const a = document.createElement("a"); a.href = href; a.download = name; a.click(); }

const tools = window.TOOLS || [];
const byId = Object.fromEntries(tools.map((t) => [t.id, t]));

// ---------- pinned tools (saved in this browser only) ----------
const PIN_KEY = "twatos-pins";
function loadPins() {
  try {
    const v = JSON.parse(localStorage.getItem(PIN_KEY) || "[]");
    return Array.isArray(v) ? v.filter((id, i) => byId[id] && v.indexOf(id) === i) : [];
  } catch (e) { return []; }                              // storage blocked or damaged: start with no pins
}
function savePins() {
  try { localStorage.setItem(PIN_KEY, JSON.stringify(pins)); } catch (e) { /* private mode: pins last for this visit only */ }
}
let pins = loadPins();
const isPinned = (id) => pins.includes(id);

// ---------- cards and panels ----------
const wraps = {};                                         // tool id -> card wrapper (card link + pin button)
tools.forEach((t) => {
  const wrap = document.createElement("div");
  wrap.className = "card-wrap cat-" + t.cat; wrap.dataset.tool = t.id;
  const a = document.createElement("a");
  a.className = "tool-card cat-" + t.cat; a.href = "#" + t.id;
  a.innerHTML = '<span class="emoji">' + t.emoji + "</span><h3>" + t.title + "</h3><p>" + t.desc + "</p>";
  const pin = document.createElement("button");
  pin.type = "button"; pin.className = "pin"; pin.textContent = "☆";
  pin.setAttribute("aria-label", "Pin " + t.title); pin.setAttribute("aria-pressed", "false");
  pin.addEventListener("click", () => togglePin(t.id));
  wrap.append(a, pin); wraps[t.id] = wrap;
  $("grid").append(wrap);
  const s = document.createElement("section");
  s.className = "tool-panel"; s.id = "panel-" + t.id; s.hidden = true; s.innerHTML = t.html;
  $("bench").append(s);
});
const cards = tools.map((t) => wraps[t.id]);              // stays in tool order; the grid order changes with pins

function refreshPins() {
  const focused = document.activeElement;
  tools.forEach((t) => {
    const on = isPinned(t.id), pin = wraps[t.id].querySelector(".pin");
    wraps[t.id].classList.toggle("pinned", on);
    pin.setAttribute("aria-pressed", String(on)); pin.textContent = on ? "★" : "☆";
  });
  // pinned tools first (in the order they were pinned), then the rest in the original order
  [...pins.map((id) => wraps[id]), ...cards.filter((c) => !isPinned(c.dataset.tool))].forEach((w) => $("grid").append(w));
  if (focused && focused !== document.body && focused.focus) focused.focus({ preventScroll: true });   // moving a node can drop keyboard focus
  const cur = byId[location.hash.slice(1)], tp = $("tool-pin");
  if (cur) { const on = isPinned(cur.id); tp.setAttribute("aria-pressed", String(on)); tp.textContent = on ? "★ Pinned" : "☆ Pin this tool"; }
}
function togglePin(id) {
  pins = isPinned(id) ? pins.filter((x) => x !== id) : [...pins, id];
  savePins(); refreshPins(); applyFilter();
}
$("tool-pin").addEventListener("click", () => { const t = byId[location.hash.slice(1)]; if (t) togglePin(t.id); });
window.addEventListener("storage", (e) => { if (e.key === PIN_KEY) { pins = loadPins(); refreshPins(); applyFilter(); } });   // another tab changed them

function route() {
  const t = byId[location.hash.slice(1)];
  $("view-home").hidden = !!t;
  $("view-tool").hidden = !t;
  
  // Hide the hopeful note when using a tool, show it again on the home page
  if ($("note")) $("note").hidden = !!t;

  tools.forEach((x) => { $("panel-" + x.id).hidden = x !== t; });
  document.title = t ? t.title + " | Twatos Tools" : "Twatos Tools: silly tools that actually work";
  if (!t) return;
  const card = wraps[t.id].querySelector(".tool-card");
  $("view-tool").style.setProperty("--c", getComputedStyle(card).getPropertyValue("--c"));
  $("view-tool").style.setProperty("--emoji", '"' + t.emoji + '"');
  refreshPins();
  if (!t.ready) {
    t.ready = true;
    try { t.init(); } catch (e) { console.error("Tool failed to start:", t.id, e); }
  }
  window.scrollTo(0, 0);
  $("bench").focus({ preventScroll: true });
}
window.addEventListener("hashchange", route);

// ---------- search and filters ----------
let activeCat = "all";
function applyFilter() {
  const q = $("search").value.trim().toLowerCase();
  let shown = 0;
  cards.forEach((c) => {
    const t = byId[c.dataset.tool];
    const inCat = activeCat === "all" || (activeCat === "pinned" ? isPinned(t.id) : t.cat === activeCat);
    const match = inCat && (c.firstChild.textContent + " " + t.cat + " " + t.kw).toLowerCase().includes(q);
    c.hidden = !match;
    if (match) shown++;
  });
  $("count").textContent = shown + (shown === 1 ? " tool" : " tools") + " in the pile" + (pins.length ? " · " + pins.length + " pinned" : "");
  $("empty").textContent = activeCat === "pinned" && !pins.length && !q
    ? "⭐ Nothing pinned yet. Tap the star on any tool to keep it close."
    : "🫥 No tool matches that. Clear the search or try a shorter word.";
  $("empty").hidden = shown !== 0;
}
$("search").addEventListener("input", applyFilter);
$("search").addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const first = [...$("grid").children].find((c) => !c.hidden);   // first card as shown on screen
  if (first) location.hash = first.dataset.tool;
});
$("chips").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  activeCat = chip.dataset.cat;
  document.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
  applyFilter();
});
document.addEventListener("keydown", (e) => {
  const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);
  if (e.key === "/" && !typing && !$("view-home").hidden) { e.preventDefault(); $("search").focus(); }
});

// ---------- a hopeful note every time the home page opens ----------
(function note() {
  const list = Array.isArray(window.NOTES) ? window.NOTES.filter(Boolean) : [];
  if (!list.length) return;                                // keep the default note from index.html
  const LAST = "twatos-last-note", text = $("note-text");
  let last = -1;
  try { last = +sessionStorage.getItem(LAST); } catch (e) { /* ignore */ }
  const next = () => {
    let i = secureInt(list.length);
    if (list.length > 1) while (i === last) i = secureInt(list.length);   // never the same note twice in a row
    last = i;
    try { sessionStorage.setItem(LAST, String(i)); } catch (e) { /* ignore */ }
    return list[i];
  };
  text.textContent = next();
  $("note-next").addEventListener("click", () => {
    text.setAttribute("aria-live", "polite");              // announce changes only after the person asks for one
    text.textContent = next();
  });
})();

refreshPins();
applyFilter();
route();