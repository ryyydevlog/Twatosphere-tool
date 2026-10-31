// just for fun

// dice tumbler
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

// name picker
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


// decision wheel
(window.TOOLS ||= []).push({
  id: "wheel", title: "Decision Wheel", emoji: "🎡",
  desc: "Add your options, spin the wheel and let it decide.",
  cat: "fun", kw: "wheel spin random choose decide pick raffle lucky draw roulette picker",
  html: `
<style>
#wheel-canvas{display:block;margin:0 auto;max-width:100%;touch-action:manipulation;cursor:pointer}
#wheel-canvas:focus-visible{outline:3px solid var(--convert);outline-offset:4px;border-radius:50%}
</style>
<h2>Decision Wheel</h2><p class="hint">One option per line (up to 40). Add a name twice to double its chances. Tap the wheel or press Spin.</p>
<label for="wheel-in">Options</label><textarea id="wheel-in" style="min-height:130px">Pizza
Noodles
Burgers
Sushi
Salad
Tacos</textarea>
<div class="opts"><label><input type="checkbox" id="wheel-remove"> Remove the winner after each spin</label><label><input type="checkbox" id="wheel-tick"> Tick sound</label></div>
<div id="wheel-box" style="max-width:420px;margin:18px auto 0"><canvas id="wheel-canvas" role="img" aria-label="Decision wheel" tabindex="0"></canvas></div>
<div class="row" style="justify-content:center"><button class="btn" id="wheel-go">Spin!</button></div>
<div class="result big center" id="wheel-out" aria-live="polite">Press Spin.</div>
<ul class="list" id="wheel-hist"></ul>
  `,
  init() {
    const COLORS = ["#b2502a", "#3c6e91", "#9c3d63", "#3f7d5c", "#c9962b", "#6b5b95", "#4f8a8b", "#a0522d"];
    const INK = "#23271f", PAPER = "#fbf6e8", TAU = Math.PI * 2, MAX = 40;
    const cv = $("wheel-canvas"), x = cv.getContext("2d"), out = $("wheel-out"), goBtn = $("wheel-go"), input = $("wheel-in");
    let angle = 0, spinning = false, raf = 0, winner = -1, size = 0, hist = [], audio = null;

    const allNames = () => input.value.split("\n").map((s) => s.trim()).filter(Boolean);
    const list = () => allNames().slice(0, MAX);
    const colorOf = (i, n) => (i === n - 1 && i > 0 && i % COLORS.length === 0) ? COLORS[4] : COLORS[i % COLORS.length];
    const light = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

    function draw() {
      const opts = list(), css = Math.min($("wheel-box").clientWidth || 0, 420);
      if (!css) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      if (size !== css) { size = css; cv.width = Math.round(css * dpr); cv.height = Math.round(css * dpr); cv.style.width = css + "px"; cv.style.height = css + "px"; }
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, css, css);
      const cx = css / 2, cy = css / 2, rad = css / 2 - 18, n = opts.length;
      cv.setAttribute("aria-label", n < 2 ? "Decision wheel. Add at least two options." : "Decision wheel with " + n + " options: " + opts.slice(0, 8).join(", ") + (n > 8 ? " and more" : ""));
      x.save(); x.translate(cx, cy);
      if (n < 2) {
        x.beginPath(); x.arc(0, 0, rad, 0, TAU); x.fillStyle = "#e2d5b4"; x.fill(); x.lineWidth = 3; x.strokeStyle = INK; x.stroke();
        x.fillStyle = INK; x.font = '600 18px "Work Sans",system-ui,sans-serif'; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("Add 2 or more options", 0, 0);
      } else {
        const a = TAU / n;
        x.rotate(angle);
        for (let i = 0; i < n; i++) {
          x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, rad, i * a, (i + 1) * a); x.closePath();
          x.fillStyle = colorOf(i, n); x.fill(); x.lineWidth = 2; x.strokeStyle = PAPER; x.stroke();
        }
        if (winner >= 0 && winner < n && !spinning) { x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, rad, winner * a, (winner + 1) * a); x.closePath(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke(); }
        const px = Math.max(10, Math.min(20, rad * a * 0.45)), maxW = rad - 54;
        x.font = '600 ' + px + 'px "Work Sans",system-ui,sans-serif'; x.textAlign = "right"; x.textBaseline = "middle";
        for (let i = 0; i < n; i++) {
          let t = opts[i];
          if (x.measureText(t).width > maxW) { while (t.length > 1 && x.measureText(t + "…").width > maxW) t = t.slice(0, -1); t += "…"; }
          x.save(); x.rotate(i * a + a / 2); x.fillStyle = light(colorOf(i, n)) > 0.3 ? INK : PAPER; x.fillText(t, rad - 14, 0); x.restore();
        }
      }
      x.restore();
      x.beginPath(); x.arc(cx, cy, 16, 0, TAU); x.fillStyle = PAPER; x.fill(); x.lineWidth = 3; x.strokeStyle = INK; x.stroke();
      x.beginPath(); x.moveTo(cx - 13, cy - rad - 14); x.lineTo(cx + 13, cy - rad - 14); x.lineTo(cx, cy - rad + 16); x.closePath();
      x.fillStyle = INK; x.fill(); x.lineWidth = 2; x.strokeStyle = PAPER; x.stroke();
    }

    function tick() {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        if (!audio) audio = new AC();
        const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
        o.frequency.value = 1400; g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
        o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + 0.04);
      } catch (e) { /* sound is optional */ }
    }
    const sliceAt = (a, n) => Math.floor((((-Math.PI / 2 - a) % TAU) + TAU) % TAU / (TAU / n));

    function lock(on) { input.readOnly = on; goBtn.disabled = on; $("wheel-remove").disabled = on; }
    function finish(names, w) {
      spinning = false; angle = ((angle % TAU) + TAU) % TAU; winner = w; lock(false);
      let msg = "🎉 " + names[w];
      hist.unshift(names[w]); hist = hist.slice(0, 5);
      $("wheel-hist").textContent = "";
      hist.forEach((h, i) => { const li = document.createElement("li"); li.textContent = h + (i === 0 ? " (latest)" : ""); $("wheel-hist").append(li); });
      if ($("wheel-remove").checked) {
        const all = allNames(); all.splice(w, 1); input.value = all.join("\n"); winner = -1; msg += " (removed from the list)";
      }
      out.textContent = msg; draw();
    }
    function spin() {
      if (spinning) return;
      const names = list(), n = names.length;
      if (n < 2) { out.textContent = "Add at least 2 options first."; return; }
      const w = secureInt(n), f = 0.12 + secureInt(76) / 100, a = TAU / n;
      const target = -Math.PI / 2 - (w + f) * a;                       // puts the middle of the winning slice under the pointer
      const delta = (((target - angle) % TAU) + TAU) % TAU + (4 + secureInt(4)) * TAU;
      const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
      const from = angle, dur = reduce ? 0 : 4200 + secureInt(1800);
      spinning = true; winner = -1; lock(true); out.textContent = "Spinning…";
      if (!dur) { angle = from + delta; finish(names, w); return; }
      const t0 = performance.now(); let last = sliceAt(from, n);
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        angle = from + delta * (1 - Math.pow(1 - t, 4));               // fast start, long gentle slow-down
        const s = sliceAt(angle, n);
        if (s !== last) { last = s; if ($("wheel-tick").checked) tick(); }
        draw();
        if (t < 1) raf = requestAnimationFrame(step); else finish(names, w);
      };
      raf = requestAnimationFrame(step);
    }

    goBtn.onclick = spin;
    cv.addEventListener("click", spin);
    cv.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); spin(); } });
    input.addEventListener("input", () => { if (!spinning) { winner = -1; draw(); } });
    try { new ResizeObserver(() => draw()).observe($("wheel-box")); } catch (e) { window.addEventListener("resize", draw); }
    window.addEventListener("hashchange", () => { if (location.hash === "#wheel") draw(); });
    draw();
  }
});
