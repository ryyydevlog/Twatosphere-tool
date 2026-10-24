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
