/* Shared helpers, loaded by every page */
const $ = (id) => document.getElementById(id);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

/* Emoji burst when any .btn is clicked */
function burst(x, y) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
document.addEventListener("click", (e) => { if (e.target.closest(".btn")) burst(e.clientX, e.clientY); });
