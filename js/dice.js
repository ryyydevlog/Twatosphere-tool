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
