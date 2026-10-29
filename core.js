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
tools.forEach((t) => {
  const a = document.createElement("a");
  a.className = "tool-card cat-" + t.cat; a.href = "#" + t.id; a.dataset.tool = t.id;
  a.innerHTML = '<span class="emoji">' + t.emoji + "</span><h3>" + t.title + "</h3><p>" + t.desc + "</p>";
  $("grid").append(a);
  const s = document.createElement("section");
  s.className = "tool-panel"; s.id = "panel-" + t.id; s.hidden = true; s.innerHTML = t.html;
  $("bench").append(s);
});
const cards = [...$("grid").children];

function route() {
  const t = byId[location.hash.slice(1)];
  $("view-home").hidden = !!t;
  $("view-tool").hidden = !t;
  tools.forEach((x) => { $("panel-" + x.id).hidden = x !== t; });
  document.title = t ? t.title + " | Twatos Tools" : "Twatos Tools: silly tools that actually work";
  if (!t) return;
  const card = cards[tools.indexOf(t)];
  $("view-tool").style.setProperty("--c", getComputedStyle(card).getPropertyValue("--c"));
  $("view-tool").style.setProperty("--emoji", '"' + t.emoji + '"');
  if (!t.ready) {
    t.ready = true;
    try { t.init(); } catch (e) { console.error("Tool failed to start:", t.id, e); }
  }
  window.scrollTo(0, 0);
  $("bench").focus({ preventScroll: true });
}
window.addEventListener("hashchange", route);

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
$("search").addEventListener("keydown", (e) => {
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
document.addEventListener("keydown", (e) => {
  const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);
  if (e.key === "/" && !typing && !$("view-home").hidden) { e.preventDefault(); $("search").focus(); }
});

applyFilter();
route();
