/* ============================================================
   CORE: shared helpers, tool registry, router, search and filters.
   Loaded LAST, after the tools-*.js files have registered their tools.
   ============================================================ */

/* ---------- helpers used by every tool ---------- */
const $ = (id) => document.getElementById(id);

/* Unbiased secure random integer 0..max-1 (rejection sampling avoids modulo bias) */
function secureInt(max) {
  const limit = Math.floor(2 ** 32 / max) * max, a = new Uint32Array(1);
  do { crypto.getRandomValues(a); } while (a[0] >= limit);
  return a[0] % max;
}
const pick = (list) => list[secureInt(list.length)];

/* Copy text and flash the button label so people know it worked */
async function copyText(text, btn) {
  const old = btn.textContent;
  try { await navigator.clipboard.writeText(text); btn.textContent = "Copied ✓"; }
  catch (e) { btn.textContent = "Select and copy by hand"; }   // clipboard can be blocked in some viewers
  setTimeout(() => { btn.textContent = old; }, 1500);
}
/* Save a file from a URL (data: or blob:) */
function download(href, name) { const a = document.createElement("a"); a.href = href; a.download = name; a.click(); }

/* ---------- build the cards and panels from the registered tools ---------- */
const tools = window.TOOLS || [];
const byId = Object.fromEntries(tools.map((t) => [t.id, t]));
tools.forEach((t) => {
  const a = document.createElement("a");
  a.className = "tool-card"; a.href = "#" + t.id; a.dataset.tool = t.id;
  a.innerHTML = '<span class="emoji">' + t.emoji + "</span><h3>" + t.title + "</h3><p>" + t.desc + "</p>";
  $("grid").append(a);
  const s = document.createElement("section");
  s.className = "tool-panel"; s.id = "panel-" + t.id; s.hidden = true; s.innerHTML = t.html;
  $("bench").append(s);
});
const cards = [...$("grid").children];

/* ---------- ROUTER: the part after # in the URL picks the tool (index.html#qr) ---------- */
function route() {
  const t = byId[location.hash.slice(1)];
  $("view-home").hidden = !!t;
  $("view-tool").hidden = !t;
  tools.forEach((x) => { $("panel-" + x.id).hidden = x !== t; });
  document.title = t ? t.title + " | Twatos Tools" : "Twatos Tools: silly tools that actually work";
  if (!t) return;
  /* the tool page borrows its card's accent color */
  $("view-tool").style.setProperty("--c", getComputedStyle(cards[tools.indexOf(t)]).getPropertyValue("--c"));
  if (!t.ready) {
    t.ready = true;
    try { t.init(); } catch (e) { console.error("Tool failed to start:", t.id, e); }
  }
  window.scrollTo(0, 0);
  $("bench").focus({ preventScroll: true });
}
window.addEventListener("hashchange", route);

/* ---------- SEARCH AND CATEGORY FILTER ---------- */
let activeCat = "all";
function applyFilter() {
  const q = $("search").value.trim().toLowerCase();
  let shown = 0;
  cards.forEach((c) => {
    const t = byId[c.dataset.tool];
    const match = (activeCat === "all" || t.cat === activeCat) && (c.textContent + " " + t.cat + " " + t.kw).toLowerCase().includes(q);
    c.hidden = !match;
    if (match) shown++;
  });
  $("count").textContent = shown + (shown === 1 ? " tool" : " tools") + " in the pile";
  $("empty").hidden = shown !== 0;
}
$("search").addEventListener("input", applyFilter);
$("search").addEventListener("keydown", (e) => {          // Enter opens the first visible tool
  if (e.key !== "Enter") return;
  const first = cards.find((c) => !c.hidden);
  if (first) location.hash = first.dataset.tool;
});
$("chips").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  activeCat = chip.dataset.cat;
  document.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
  applyFilter();
});
document.addEventListener("keydown", (e) => {              // "/" jumps to search (home only)
  const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);
  if (e.key === "/" && !typing && !$("view-home").hidden) { e.preventDefault(); $("search").focus(); }
});

applyFilter();
route();
