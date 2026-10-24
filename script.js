/* Home page only: search, category chips, "/" shortcut. Needs common.js first. */
const cards = document.querySelectorAll(".tool-card");
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
    const match = (activeCat === "all" || cat === activeCat) && (c.textContent + " " + cat + " " + keywords).toLowerCase().includes(q);
    c.hidden = !match;
    if (match) shown++;
  });
  $("count").textContent = shown + (shown === 1 ? " tool" : " tools") + " in the pile";
  $("empty").hidden = shown !== 0;
}
$("search").addEventListener("input", applyFilter);
/* Enter in the search box opens the first visible tool */
$("search").addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const first = [...cards].find((c) => !c.hidden);
  if (first) location.href = first.href;
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
  if (e.key === "/" && !typing) { e.preventDefault(); $("search").focus(); }
});
applyFilter();
