/* ============================================================
   JUST FOR FUN TOOLS
   Each tool = one object: id, card text, search keywords, panel HTML,
   and init() which runs once, the first time the tool is opened.
   To add a tool: copy a block, change the id, html and init code.
   ============================================================ */

/* ---------- MOCKING TEXT ---------- */
(window.TOOLS ||= []).push({
  id: "mock", title: "Mocking Text", emoji: "🧽",
  desc: "tUrN tExT iNtO sArCaStIc cAsE.",
  cat: "fun", kw: "text sarcasm spongebob copy",
  html: `
<h2>Mocking Text</h2><p class="hint">Type anything. The result updates as you go.</p>
<label for="mock-in">Your text</label><textarea id="mock-in">I am definitely not being sarcastic</textarea>
<label for="mock-mode">Style</label><select id="mock-mode"><option value="alt">Alternating</option><option value="rand">Random</option></select>
<div class="result big pre" id="mock-out" aria-live="polite"></div>
<div class="row"><button class="btn" id="mock-copy">Copy</button><button class="btn alt" id="mock-clear">Clear</button></div>
  `,
  init() {
    function mockify(t, rand) {
      let low = false;
      return [...t].map((ch) => {
        if (!/[a-z]/i.test(ch)) return ch;
        low = rand ? Math.random() < 0.5 : !low;
        return low ? ch.toLowerCase() : ch.toUpperCase();
      }).join("");
    }
    const render = () => { $("mock-out").textContent = mockify($("mock-in").value, $("mock-mode").value === "rand"); };
    $("mock-in").addEventListener("input", render);
    $("mock-mode").addEventListener("change", render);
    $("mock-copy").onclick = () => copyText($("mock-out").textContent, $("mock-copy"));
    $("mock-clear").onclick = () => { $("mock-in").value = ""; render(); $("mock-in").focus(); };
    render();
  }
});

/* ---------- FATE BALL ---------- */
(window.TOOLS ||= []).push({
  id: "ball", title: "Fate Ball", emoji: "🎱",
  desc: "Ask a yes or no question. Receive confident nonsense.",
  cat: "fun", kw: "8 ball decide answer",
  html: `
<h2>Fate Ball</h2><p class="hint">Think of a yes or no question (or type it), then press the button.</p>
<label for="ball-q">Your question (optional)</label><input type="text" id="ball-q" placeholder="Should I have another snack?">
<div class="row"><button class="btn" id="ball-go">Shake it</button></div>
<div class="ball" id="ball-out" aria-live="polite">Ask me</div>
<ul class="list" id="ball-hist"></ul>
  `,
  init() {
    const answers = [
      "Yes, obviously", "Absolutely not", "Ask again after lunch", "The stars shrug", "Bold of you to ask",
      "Only on a Tuesday", "My sources say snacks", "100% maybe", "Do it, then deny it", "Sleep on it. Then do it.",
      "The pigeons say no", "Without a doubt, sort of", "Hard pass", "Yes, but wear socks", "Outlook hazy, like Mondays",
      "Your future self objects", "Why not both?", "Probably. Don't quote me.", "Consult a sandwich", "Nope, and I'm sorry"
    ];
    let last = "", hist = [];
    function shake() {
      let a; do { a = pick(answers); } while (a === last);   // never the same answer twice in a row
      last = a; $("ball-out").textContent = a;
      hist.unshift(($("ball-q").value.trim() || "(unspoken question)") + " → " + a);
      hist = hist.slice(0, 5);
      $("ball-hist").innerHTML = "";
      hist.forEach((h) => { const li = document.createElement("li"); li.textContent = h; $("ball-hist").append(li); });
    }
    $("ball-go").onclick = shake;
    $("ball-q").addEventListener("keydown", (e) => { if (e.key === "Enter") shake(); });
  }
});

/* ---------- EXCUSE MACHINE ---------- */
(window.TOOLS ||= []).push({
  id: "excuse", title: "Excuse Machine", emoji: "🐕",
  desc: "A believable reason for being late. Believable-ish.",
  cat: "fun", kw: "late lie copy",
  html: `
<h2>Excuse Machine</h2><p class="hint">For when you are late and honesty feels risky.</p>
<div class="row"><button class="btn" id="excuse-go">Give me an excuse</button><button class="btn alt" id="excuse-copy">Copy</button></div>
<div class="result big" id="excuse-out" aria-live="polite">Press the button.</div>
  `,
  init() {
    const who   = ["My cat", "A very confident pigeon", "The elevator", "My neighbour", "My phone", "A suspicious squirrel", "My GPS", "The bus", "My landlord", "A rogue shopping trolley"];
    const did   = ["unplugged", "held a meeting about", "hid", "tried to negotiate with", "stood on", "borrowed", "reorganised", "locked me out of", "filed a complaint about", "fell in love with"];
    const thing = ["my alarm clock", "my car keys", "the front door", "my left shoe", "the whole morning", "my coffee", "my only clean shirt", "the stairs", "my wallet", "my sense of direction"];
    const tail  = ["", "", "", " right before I left", " (again)", " and I have no proof", ", and nobody believes me either", " while I was already running late"];
    $("excuse-go").onclick = () => { $("excuse-out").textContent = pick(who) + " " + pick(did) + " " + pick(thing) + pick(tail) + "."; };
    $("excuse-copy").onclick = () => copyText($("excuse-out").textContent, $("excuse-copy"));
  }
});

/* ---------- DICE TUMBLER ---------- */
(window.TOOLS ||= []).push({
  id: "dice", title: "Dice Tumbler", emoji: "🎲",
  desc: "Roll dice of any size, or flip a coin.",
  cat: "fun", kw: "roll game random coin d20 flip",
  html: `
<h2>Dice Tumbler</h2><p class="hint">Choose a die and how many, then roll. Or flip a coin.</p>
<label for="dice-s">Type of die</label><select id="dice-s"><option value="4">d4</option><option value="6" selected>d6</option><option value="8">d8</option><option value="10">d10</option><option value="12">d12</option><option value="20">d20</option><option value="100">d100</option></select>
<label for="dice-n">How many</label><select id="dice-n"></select>
<div class="row"><button class="btn" id="dice-go">Roll</button><button class="btn alt" id="coin-go">Flip a coin</button></div>
<div class="result big" id="dice-out" aria-live="polite">🎲</div>
<p class="big" id="dice-total" aria-live="polite"></p>
<ul class="list" id="dice-hist"></ul>
  `,
  init() {
    const d6 = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    let hist = [];
    for (let i = 1; i <= 10; i++) $("dice-n").add(new Option(i, i, false, i === 2));
    function log(t) {
      hist.unshift(t); hist = hist.slice(0, 5);
      $("dice-hist").innerHTML = "";
      hist.forEach((h) => { const li = document.createElement("li"); li.textContent = h; $("dice-hist").append(li); });
    }
    $("dice-go").onclick = () => {
      const n = +$("dice-n").value, s = +$("dice-s").value;
      const r = Array.from({ length: n }, () => secureInt(s) + 1), total = r.reduce((a, b) => a + b, 0);
      $("dice-out").style.fontSize = s === 6 ? "3rem" : "";
      $("dice-out").textContent = s === 6 ? r.map((v) => d6[v - 1]).join(" ") : r.join(" · ");
      $("dice-total").textContent = "Total: " + total;
      log(n + "d" + s + ": " + r.join(" + ") + " = " + total);
    };
    $("coin-go").onclick = () => {
      const side = secureInt(2) ? "Heads" : "Tails";
      $("dice-out").style.fontSize = ""; $("dice-out").textContent = "🪙 " + side;
      $("dice-total").textContent = ""; log("Coin: " + side);
    };
  }
});

/* ---------- NAME PICKER ---------- */
(window.TOOLS ||= []).push({
  id: "picker", title: "Name Picker", emoji: "🎯",
  desc: "Pick a random name, or split a list into teams.",
  cat: "fun", kw: "random names team choose raffle draw shuffle",
  html: `
<h2>Name Picker</h2><p class="hint">One name per line. Pick a winner or split everyone into teams.</p>
<label for="pick-in">Names</label><textarea id="pick-in" style="min-height:140px">Alex
Sam
Jordan
Taylor
Riley
Casey</textarea>
<div class="opts"><label><input type="checkbox" id="pick-remove"> Remove the name once picked</label></div>
<label for="pick-teams">Number of teams</label><select id="pick-teams"><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select>
<div class="row"><button class="btn" id="pick-go">Pick one</button><button class="btn alt" id="pick-split">Make teams</button></div>
<div class="result big pre" id="pick-out" aria-live="polite">Add some names, then press a button.</div>
  `,
  init() {
    const names = () => $("pick-in").value.split("\n").map((s) => s.trim()).filter(Boolean);
    $("pick-go").onclick = () => {
      const list = names();
      if (!list.length) { $("pick-out").textContent = "Add at least one name first."; return; }
      const i = secureInt(list.length);
      $("pick-out").textContent = "🎉 " + list[i];
      if ($("pick-remove").checked) { list.splice(i, 1); $("pick-in").value = list.join("\n"); }
    };
    $("pick-split").onclick = () => {
      const list = names(), k = +$("pick-teams").value;
      if (list.length < k) { $("pick-out").textContent = "You need at least " + k + " names for " + k + " teams."; return; }
      for (let i = list.length - 1; i > 0; i--) { const j = secureInt(i + 1); [list[i], list[j]] = [list[j], list[i]]; }  // shuffle
      const teams = Array.from({ length: k }, () => []);
      list.forEach((n, i) => teams[i % k].push(n));                                                                      // deal like cards
      $("pick-out").textContent = teams.map((t, i) => "Team " + (i + 1) + ": " + t.join(", ")).join("\n");
    };
  }
});
