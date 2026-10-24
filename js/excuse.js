/* ---------- TOOL 5: EXCUSE MACHINE ----------
   Mix-and-match: one random piece from each list builds a sentence.
   3 lists with 5 items each gives 125 different excuses. */
const who   = ["My cat", "A very confident pigeon", "The elevator", "My neighbour", "My phone"];
const did   = ["unplugged", "held a meeting about", "hid", "tried to negotiate with", "stood on"];
const thing = ["my alarm clock", "my car keys", "the front door", "my left shoe", "the whole morning"];
$("excuse-go").addEventListener("click", () => {
  $("excuse-out").textContent = pick(who) + " " + pick(did) + " " + pick(thing) + ".";
});
