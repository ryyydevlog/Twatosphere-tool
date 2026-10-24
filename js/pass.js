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
