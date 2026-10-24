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
