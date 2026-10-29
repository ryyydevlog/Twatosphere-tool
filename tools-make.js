// make: tools that generate something for you

// qr maker
(window.TOOLS ||= []).push({
  id: "qr", title: "QR Maker", emoji: "🔳",
  desc: "Turn any text or link into a scannable square.",
  cat: "make", kw: "code link scan url download",
  html: `
<h2>QR Maker</h2><p class="hint">Type a link or any text. The code updates as you type.</p>
<label for="qr-text">Text or link</label><input type="text" id="qr-text" value="https://example.com">
<label for="qr-size">Size</label><select id="qr-size"><option value="180">Small</option><option value="260" selected>Medium</option><option value="360">Large</option></select>
<div class="row"><button class="btn" id="qr-go">Make my QR</button><button class="btn alt" id="qr-dl" disabled>Download PNG</button></div>
<div class="result center" id="qr-out" aria-live="polite"></div>
  `,
  init() {
    function make() {
      const text = $("qr-text").value.trim(), box = $("qr-out"), s = +$("qr-size").value;
      $("qr-dl").disabled = true;
      if (!text) { box.textContent = "Type something first."; return; }
      if (typeof QRCode === "undefined") { box.textContent = "The QR library did not load. Check your connection and reload."; return; }
      box.innerHTML = "";
      try { new QRCode(box, { text, width: s, height: s, colorDark: "#000000", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.M }); }
      catch (e) { box.textContent = "That is too long for a QR code. Shorten it a bit."; return; }
      $("qr-dl").disabled = false;
    }
    /* Download adds a white border, because scanners need a quiet zone around the code */
    $("qr-dl").onclick = () => {
      const el = $("qr-out").querySelector("canvas") || $("qr-out").querySelector("img");
      if (!el) return;
      const s = +$("qr-size").value, pad = 24, c = document.createElement("canvas");
      c.width = c.height = s + pad * 2;
      const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(el, pad, pad, s, s);
      download(c.toDataURL("image/png"), "qr-code.png");
    };
    $("qr-go").onclick = make;
    $("qr-text").addEventListener("input", make);
    $("qr-size").addEventListener("change", make);
    make();
  }
});

// password blender
(window.TOOLS ||= []).push({
  id: "pass", title: "Password Blender", emoji: "🔐",
  desc: "Strong random passwords, made on your device.",
  cat: "make", kw: "secure random generator strength copy",
  html: `
<h2>Password Blender</h2><p class="hint">Pick a length and what goes in, then blend.</p>
<label for="pass-len">Length: <span id="pass-len-val">20</span></label><input type="range" id="pass-len" min="8" max="64" value="20">
<div class="opts" id="pass-opts">
<label><input type="checkbox" id="pass-lower" checked> abc</label><label><input type="checkbox" id="pass-upper" checked> ABC</label>
<label><input type="checkbox" id="pass-digits" checked> 123</label><label><input type="checkbox" id="pass-symbols" checked> !@#</label>
<label><input type="checkbox" id="pass-look" checked> Skip look-alikes (l, 1, O, 0)</label></div>
<div class="row"><button class="btn" id="pass-go">Blend a password</button><button class="btn alt" id="pass-copy">Copy</button></div>
<div class="result big" id="pass-out" style="font-family:monospace"></div>
<p class="hint" id="pass-meter" aria-live="polite" style="margin-top:10px"></p>
  `,
  init() {
    const SAFE = { lower: "abcdefghijkmnopqrstuvwxyz", upper: "ABCDEFGHJKLMNPQRSTUVWXYZ", digits: "23456789", symbols: "!@#$%&*?" };
    const FULL = { lower: "abcdefghijklmnopqrstuvwxyz", upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", digits: "0123456789", symbols: "!@#$%&*?" };
    function blend() {
      const src = $("pass-look").checked ? SAFE : FULL;
      let on = Object.keys(src).filter((k) => $("pass-" + k).checked);
      if (!on.length) { $("pass-lower").checked = true; on = ["lower"]; }   // always keep at least one set
      const len = +$("pass-len").value, pool = on.map((k) => src[k]).join("");
      const pw = on.map((k) => src[k][secureInt(src[k].length)]);          // one from each chosen set...
      while (pw.length < len) pw.push(pool[secureInt(pool.length)]);        // ...then fill up
      for (let i = len - 1; i > 0; i--) { const j = secureInt(i + 1); [pw[i], pw[j]] = [pw[j], pw[i]]; }  // shuffle
      $("pass-out").textContent = pw.join("");
      const bits = Math.round(len * Math.log2(pool.length));
      $("pass-meter").textContent = "Strength: " + (bits < 50 ? "weak" : bits < 70 ? "okay" : bits < 100 ? "strong" : "very strong") + " (about " + bits + " bits)";
    }
    $("pass-len").addEventListener("input", (e) => { $("pass-len-val").textContent = e.target.value; blend(); });
    $("pass-opts").addEventListener("change", blend);
    $("pass-go").onclick = blend;
    $("pass-copy").onclick = () => copyText($("pass-out").textContent, $("pass-copy"));
    blend();
  }
});

// palette roulette
(window.TOOLS ||= []).push({
  id: "palette", title: "Palette Roulette", emoji: "🎨",
  desc: "Five random colors. Lock favorites, copy hex codes.",
  cat: "make", kw: "color colour design hex lock",
  html: `
<h2>Palette Roulette</h2><p class="hint">Spin until something looks good. Lock colors you like, click a code to copy it, or press Space to spin.</p>
<div class="row"><button class="btn" id="palette-go">Spin</button><button class="btn alt" id="palette-copy">Copy all</button></div>
<div class="swatches" id="palette-out" style="margin-top:16px"></div>
  `,
  init() {
    const cols = Array.from({ length: 5 }, () => ({ hex: "#000000", lock: false }));
    function hslToHex(h, s, l) {
      s /= 100; l /= 100;
      const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
      const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
      return "#" + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, "0")).join("");
    }
    /* Real contrast: pick black or white text depending on how bright the color is */
    function lum(hex) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16) / 255).map((v) => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    function render() {
      const box = $("palette-out"); box.innerHTML = "";
      cols.forEach((c) => {
        const d = document.createElement("div"); d.className = "swatch";
        d.style.background = c.hex; d.style.color = lum(c.hex) > 0.4 ? "#000" : "#fff";
        const h = document.createElement("button"); h.textContent = c.hex.toUpperCase(); h.title = "Copy this color";
        h.onclick = () => copyText(c.hex.toUpperCase(), h);
        const l = document.createElement("button"); l.textContent = c.lock ? "🔒 Locked" : "🔓 Lock"; l.setAttribute("aria-pressed", c.lock);
        l.onclick = () => { c.lock = !c.lock; render(); };
        d.append(h, l); box.append(d);
      });
    }
    function spin() {
      cols.forEach((c) => { if (!c.lock) c.hex = hslToHex(Math.random() * 360, 55 + Math.random() * 30, 40 + Math.random() * 35); });
      render();
    }
    $("palette-go").onclick = spin;
    $("palette-copy").onclick = () => copyText(cols.map((c) => c.hex.toUpperCase()).join(", "), $("palette-copy"));
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && !$("panel-palette").hidden && !["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(document.activeElement.tagName)) { e.preventDefault(); spin(); }
    });
    spin();
  }
});

// focus timer
(window.TOOLS ||= []).push({
  id: "timer", title: "Focus Timer", emoji: "⏱️",
  desc: "A simple countdown with presets and a beep.",
  cat: "make", kw: "countdown pomodoro focus stopwatch alarm",
  html: `
<h2>Focus Timer</h2><p class="hint">Pick a preset or type your own minutes, then start.</p>
<div class="row"><button class="btn alt" data-min="5">5 min</button><button class="btn alt" data-min="10">10 min</button><button class="btn alt" data-min="25">25 min</button><button class="btn alt" data-min="50">50 min</button></div>
<label for="timer-custom">Custom minutes</label><input type="number" id="timer-custom" min="1" max="600" value="25">
<div class="result big timer" id="timer-out" role="timer">25:00</div>
<p class="big" id="timer-msg" aria-live="polite"></p>
<div class="row"><button class="btn" id="timer-go">Start</button><button class="btn alt" id="timer-reset">Reset</button></div>
  `,
  init() {
    let preset = 25, left = 25 * 60, end = 0, tick = null;
    function show() {
      const t = String(Math.floor(left / 60)).padStart(2, "0") + ":" + String(left % 60).padStart(2, "0");
      $("timer-out").textContent = t;
      if (!$("panel-timer").hidden) document.title = (tick ? t + " · " : "") + "Focus Timer | Twatos Tools";   // see the time from another tab
    }
    function stop() { clearInterval(tick); tick = null; $("timer-go").textContent = "Start"; }
    function setMins(m) { stop(); preset = m; left = Math.round(m * 60); $("timer-msg").textContent = ""; show(); }
    function beep() {
      try { const a = new AudioContext(); [0, 0.3, 0.6].forEach((t) => { const o = a.createOscillator(); o.connect(a.destination); o.frequency.value = 880; o.start(a.currentTime + t); o.stop(a.currentTime + t + 0.15); }); } catch (e) {}
    }
    function start() {
      if (tick || left <= 0) return;
      end = Date.now() + left * 1000;                               // based on the clock, so tab throttling cannot slow it
      tick = setInterval(() => {
        left = Math.max(0, Math.round((end - Date.now()) / 1000)); show();
        if (left === 0) { stop(); beep(); $("timer-msg").textContent = "⏰ Time's up!"; }
      }, 250);
      $("timer-go").textContent = "Pause"; show();
    }
    $("timer-go").onclick = () => { if (tick) { stop(); show(); } else start(); };
    $("timer-reset").onclick = () => setMins(preset);
    document.querySelectorAll("[data-min]").forEach((b) => b.addEventListener("click", () => { $("timer-custom").value = b.dataset.min; setMins(+b.dataset.min); }));
    $("timer-custom").addEventListener("change", (e) => { const m = Math.min(600, Math.max(1, +e.target.value || 25)); e.target.value = m; setMins(m); });
    show();
  }
});
