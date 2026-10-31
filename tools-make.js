// make: tools that generate something for you

// qr maker
(window.TOOLS ||= []).push({
  id: "qr", title: "QR Maker", emoji: "🔳",
  desc: "Turn text, links, Wi-Fi details, contacts or small files into a scannable square.",
  cat: "make", kw: "code link scan url download file txt vcf contact text wifi network password card split",
  html: `
<h2>QR Maker</h2><p class="hint">Make a code for a link, text, Wi-Fi network, contact card or small file. Everything stays on your device.</p>
<div class="hint" id="qr-cap-note" style="border:2px dashed var(--ink);border-radius:8px;padding:10px 14px;background:var(--receipt)">
<b>How much fits?</b> One QR code holds about <b>2.9 KB</b> at most, roughly 2,900 plain English characters.
<ul class="list" style="margin:6px 0 0">
<li>Higher error correction survives smudges but holds less: Low 2,953 · Medium 2,331 · Quartile 1,663 · High 1,273 bytes.</li>
<li>Accented letters take 2 bytes, most Asian scripts 3, emoji 4.</li>
<li>A text file too big for one code is split into numbered codes (up to 30, about 29 KB in total).</li>
<li>Photos, PDFs and other binary files do not fit.</li>
</ul></div>

<label for="qr-mode">What is it for?</label>
<select id="qr-mode"><option value="text">Text or link</option><option value="wifi">Wi-Fi network</option><option value="vcard">Contact card</option><option value="file">Small file</option></select>

<div id="qr-p-text">
<label for="qr-text">Text or link</label><textarea id="qr-text" style="min-height:90px">https://youtube.com</textarea>
</div>

<div id="qr-p-file" hidden>
<label for="qr-file">Choose a text-based file</label><input type="file" id="qr-file">
<p class="hint" id="qr-file-note" style="margin:6px 0 0" aria-live="polite">Works with .txt, .vcf, .ics, .csv, .json, .md and other plain-text files, up to about 29 KB. If it does not fit in one code, it is split into numbered codes. Scan them in order; each one starts with a tag like [1/3].</p>
</div>

<div id="qr-p-wifi" hidden>
<label for="qr-w-ssid">Network name (SSID)</label><input type="text" id="qr-w-ssid" autocomplete="off">
<label for="qr-w-pass">Password</label><input type="text" id="qr-w-pass" autocomplete="off">
<label for="qr-w-sec">Security</label><select id="qr-w-sec"><option value="WPA" selected>WPA / WPA2 / WPA3</option><option value="WEP">WEP</option><option value="nopass">None (open network)</option></select>
<div class="opts"><label><input type="checkbox" id="qr-w-hidden"> Hidden network</label></div>
</div>

<div id="qr-p-vcard" hidden>
<label for="qr-v-first">First name</label><input type="text" id="qr-v-first" autocomplete="off">
<label for="qr-v-last">Last name</label><input type="text" id="qr-v-last" autocomplete="off">
<label for="qr-v-org">Company</label><input type="text" id="qr-v-org" autocomplete="off">
<label for="qr-v-tel">Phone</label><input type="text" id="qr-v-tel" placeholder="+60 12-345 6789" autocomplete="off">
<label for="qr-v-email">Email</label><input type="text" id="qr-v-email" autocomplete="off">
<label for="qr-v-url">Website</label><input type="text" id="qr-v-url" autocomplete="off">
</div>

<label for="qr-ec">Error correction</label><select id="qr-ec"><option value="M" selected>Medium (default)</option><option value="L">Low (fits the most data)</option><option value="Q">Quartile</option><option value="H">High (survives smudges)</option></select>
<label for="qr-size">Size</label><select id="qr-size"><option value="180">Small</option><option value="260" selected>Medium</option><option value="360">Large</option><option value="640">Huge (for dense codes)</option></select>
<div class="row"><button class="btn" id="qr-go">Make my QR</button><button class="btn alt" id="qr-dl" disabled>Download PNG</button></div>
<p class="hint" id="qr-info" style="margin-top:10px" aria-live="polite"></p>
<div class="row" id="qr-nav" hidden><button class="btn alt" id="qr-prev">← Previous</button><span class="big" id="qr-page" aria-live="polite" style="align-self:center"></span><button class="btn alt" id="qr-next">Next →</button></div>
<div class="result center" id="qr-out" aria-live="polite"></div>
  `,
  init() {
    /* Max bytes one QR code can hold (version 40, byte mode) for each error-correction level */
    const CAP = { L: 2953, M: 2331, Q: 1663, H: 1273 };
    const PART = 1000;                                  // bytes of file text per code when a file is split (keeps each code easy to scan)
    const MAX_PARTS = 30, MAX_FILE = 29000;
    const bytesOf = (t) => new TextEncoder().encode(t).length;
    const val = (id) => $(id).value.trim();
    let fileText = "", fileName = "", parts = [], idx = 0;

    /* Build the text that goes into the code, depending on the chosen mode */
    const escWifi = (s) => s.replace(/([\\;,:"])/g, "\\$1");
    const escV = (s) => s.replace(/([\\;,])/g, "\\$1").replace(/\r?\n/g, "\\n");
    function payload() {
      const mode = $("qr-mode").value;
      if (mode === "file") return fileText;
      if (mode === "wifi") {
        const ssid = val("qr-w-ssid"), sec = $("qr-w-sec").value;
        if (!ssid) return "";
        return "WIFI:T:" + sec + ";S:" + escWifi(ssid) + ";" + (sec === "nopass" ? "" : "P:" + escWifi($("qr-w-pass").value) + ";") + ($("qr-w-hidden").checked ? "H:true;" : "") + ";";
      }
      if (mode === "vcard") {
        const first = val("qr-v-first"), last = val("qr-v-last"), org = val("qr-v-org"), tel = val("qr-v-tel"), email = val("qr-v-email"), url = val("qr-v-url");
        if (!(first || last || org || tel || email || url)) return "";
        const lines = ["BEGIN:VCARD", "VERSION:3.0", "N:" + escV(last) + ";" + escV(first) + ";;;", "FN:" + escV([first, last].filter(Boolean).join(" ") || org || tel || email)];
        if (org) lines.push("ORG:" + escV(org));
        if (tel) lines.push("TEL;TYPE=CELL:" + escV(tel));
        if (email) lines.push("EMAIL:" + escV(email));
        if (url) lines.push("URL:" + escV(url));
        lines.push("END:VCARD");
        return lines.join("\r\n");
      }
      return val("qr-text");
    }
    const EMPTY = { text: "Type something first.", wifi: "Enter the network name first.", vcard: "Fill in at least one field first.", file: "Choose a file first." };

    /* Cut text into pieces of at most PART bytes (never in the middle of a character) and tag each one [1/3] */
    function split(text) {
      const out = []; let cur = "", curB = 0;
      for (const ch of text) {
        const b = bytesOf(ch);
        if (curB + b > PART) { out.push(cur); cur = ""; curB = 0; }
        cur += ch; curB += b;
      }
      if (cur) out.push(cur);
      return out.map((p, i) => "[" + (i + 1) + "/" + out.length + "]\n" + p);
    }

    function make() {
      const mode = $("qr-mode").value, text = payload(), box = $("qr-out"), ec = $("qr-ec").value;
      $("qr-dl").disabled = true; $("qr-info").textContent = ""; $("qr-nav").hidden = true; parts = [];
      if (!text.trim()) { box.textContent = EMPTY[mode]; return; }
      const n = bytesOf(text);
      if (n <= CAP[ec]) {
        parts = [text];
        $("qr-info").textContent = n + " of " + CAP[ec] + " bytes used." + (n > 700 ? " Dense code: use a big size and scan it from a screen." : "");
      } else if (mode === "file" && n <= MAX_FILE) {
        parts = split(text);
        $("qr-info").textContent = n + " bytes is too much for one code, so it is split into " + parts.length + " codes. Scan them in order; each starts with a tag like [1/" + parts.length + "].";
      } else {
        box.textContent = "Too much data for one QR code (" + n + " bytes, limit " + CAP[ec] + " at this error-correction level)." + (mode === "file" ? " Files can be up to about 29 KB." : ec !== "L" ? " Try Low error correction, or shorten the text." : " Shorten the text.");
        return;
      }
      if (typeof QRCode === "undefined") { box.textContent = "The QR library did not load. Check your connection and reload."; parts = []; return; }
      idx = Math.min(idx, parts.length - 1);
      draw();
    }

    /* Draw the code for parts[idx] */
    function draw() {
      const box = $("qr-out"), s = +$("qr-size").value;
      box.innerHTML = "";
      try { new QRCode(box, { text: parts[idx], width: s, height: s, colorDark: "#000000", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel[$("qr-ec").value] }); }
      catch (e) { box.textContent = "That is too long for a QR code. Shorten it a bit."; return; }
      $("qr-dl").disabled = false;
      $("qr-nav").hidden = parts.length < 2;
      $("qr-page").textContent = "Code " + (idx + 1) + " of " + parts.length;
      $("qr-prev").disabled = idx === 0; $("qr-next").disabled = idx === parts.length - 1;
    }

    /* Show only the form for the chosen mode */
    function syncMode() {
      const mode = $("qr-mode").value;
      ["text", "file", "wifi", "vcard"].forEach((m) => { $("qr-p-" + m).hidden = m !== mode; });
      $("qr-w-pass").disabled = $("qr-w-sec").value === "nopass";
      idx = 0;
      make();
    }

    /* Read a small text-based file (locally, never uploaded) */
    async function loadFile() {
      const f = $("qr-file").files[0], note = $("qr-file-note");
      if (!f) return;
      const reject = (msg) => { note.textContent = msg; $("qr-file").value = ""; fileText = ""; fileName = ""; idx = 0; make(); };
      if (f.size > MAX_FILE) { reject(f.name + " is " + (f.size / 1024).toFixed(1) + " KB. The limit is about 29 KB (30 codes), so this file is too big."); return; }
      let t;
      try { t = await f.text(); } catch (e) { reject("That file could not be read."); return; }
      if (/[\u0000\uFFFD]/.test(t)) { reject(f.name + " looks like a binary file (image, PDF, zip…). Only text-based files can go into a QR code."); return; }
      if (!t.trim()) { reject(f.name + " is empty."); return; }
      fileText = t; fileName = f.name; idx = 0;
      const n = bytesOf(t);
      if (n > CAP.M && n <= CAP.L) $("qr-ec").value = "L";   // fits one code only at the roomiest setting
      if (n > CAP.L) { if ($("qr-ec").value === "H") $("qr-ec").value = "M"; if (+$("qr-size").value < 360) $("qr-size").value = "360"; }
      else if (n > 600) $("qr-size").value = "640";          // dense single codes need bigger squares to scan
      note.textContent = "Loaded " + f.name + " (" + n + " bytes). Scanning the code shows the file's text.";
      make();
    }

    /* Download adds a white border, because scanners need a quiet zone around the code */
    $("qr-dl").onclick = () => {
      const el = $("qr-out").querySelector("canvas") || $("qr-out").querySelector("img");
      if (!el) return;
      const s = +$("qr-size").value, pad = 24, c = document.createElement("canvas");
      c.width = c.height = s + pad * 2;
      const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(el, pad, pad, s, s);
      download(c.toDataURL("image/png"), parts.length > 1 ? "qr-code-" + (idx + 1) + "-of-" + parts.length + ".png" : "qr-code.png");
    };
    $("qr-prev").onclick = () => { if (idx > 0) { idx--; draw(); } };
    $("qr-next").onclick = () => { if (idx < parts.length - 1) { idx++; draw(); } };
    $("qr-go").onclick = make;
    $("qr-mode").addEventListener("change", syncMode);
    $("qr-w-sec").addEventListener("change", syncMode);
    ["qr-text", "qr-p-wifi", "qr-p-vcard"].forEach((id) => $(id).addEventListener("input", make));
    $("qr-size").addEventListener("change", make);
    $("qr-ec").addEventListener("change", make);
    $("qr-file").addEventListener("change", loadFile);
    syncMode();
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

// contrast checker
(window.TOOLS ||= []).push({
  id: "contrast", title: "Contrast Checker", emoji: "🌓",
  desc: "Check text and background colors against WCAG accessibility rules.",
  cat: "make", kw: "wcag accessibility color colour ratio aa aaa text background readable a11y",
  html: `
<h2>Contrast Checker</h2><p class="hint">Pick a text color and a background color. Ratios follow WCAG 2.x.</p>
<label for="contrast-fg-hex">Text color</label>
<div class="row" style="margin-top:0"><input type="color" id="contrast-fg-pick" aria-label="Pick the text color" value="#23271f"><input type="text" id="contrast-fg-hex" value="#23271f" maxlength="7" autocomplete="off" spellcheck="false" style="flex:1;min-width:0"></div>
<label for="contrast-bg-hex">Background color</label>
<div class="row" style="margin-top:0"><input type="color" id="contrast-bg-pick" aria-label="Pick the background color" value="#fbf6e8"><input type="text" id="contrast-bg-hex" value="#fbf6e8" maxlength="7" autocomplete="off" spellcheck="false" style="flex:1;min-width:0"></div>
<div class="row"><button class="btn alt" id="contrast-swap">Swap colors ⇄</button></div>
<div class="result" id="contrast-out">
<div class="big" id="contrast-ratio" aria-live="polite"></div>
<div class="stats" id="contrast-stats"></div>
<div id="contrast-sample" style="margin-top:14px;padding:16px;border:2px solid var(--ink);border-radius:8px;font-family:'Work Sans',system-ui,sans-serif">
<div style="font-size:1.5rem;font-weight:700">Large text sample</div>
<p style="margin:6px 0 0;font-size:1rem">Normal text sample: the quick brown fox jumps over the lazy dog.</p></div>
<div id="contrast-fix" style="margin-top:12px"></div>
</div>
<p class="hint" style="margin-top:10px">Large text means 24px or bigger, or 19px or bigger in bold. Pass or fail is judged on the exact ratio.</p>
  `,
  init() {
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    const parse = (s) => { s = String(s).trim().replace(/^#/, ""); if (/^[0-9a-f]{3}$/i.test(s)) s = s.replace(/./g, "$&$&"); return /^[0-9a-f]{6}$/i.test(s) ? "#" + s.toLowerCase() : null; };
    const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const lum = (h) => {
      const [r, g, b] = rgb(h).map((v) => v / 255).map((v) => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
    /* Slide the text color toward black or white until it reaches 4.5:1 (AA for normal text) */
    function suggest(f, b) {
      const target = lum(b) > 0.179 ? "#000000" : "#ffffff";
      for (let t = 0.02; t <= 1.0001; t += 0.02) { const c = mix(f, target, t); if (ratio(c, b) >= 4.5) return c; }
      return target;
    }
    const show = (r) => (Math.floor(r * 100) / 100).toFixed(2);   // floor, so 4.499 never shows as a passing 4.50
    const TESTS = [["Normal text · AA", 4.5], ["Large text · AA", 3], ["Normal text · AAA", 7], ["Large text · AAA", 4.5], ["Icons and borders", 3]];
    const fg = { pick: $("contrast-fg-pick"), hex: $("contrast-fg-hex") }, bg = { pick: $("contrast-bg-pick"), hex: $("contrast-bg-hex") };

    function render() {
      const f = parse(fg.hex.value), b = parse(bg.hex.value);
      fg.hex.setAttribute("aria-invalid", String(!f)); bg.hex.setAttribute("aria-invalid", String(!b));
      const stats = $("contrast-stats"), fix = $("contrast-fix");
      stats.textContent = ""; fix.textContent = "";
      if (!f || !b) { $("contrast-ratio").textContent = "Enter both colors as hex codes, like #23271f."; return; }
      fg.pick.value = f; bg.pick.value = b;
      const r = ratio(f, b);
      $("contrast-ratio").textContent = show(r) + " : 1 · " + (r >= 7 ? "Excellent" : r >= 4.5 ? "Good" : r >= 3 ? "Large text only" : "Poor");
      TESTS.forEach(([label, min]) => {
        const s = el("div", "stat"); s.append(el("b", null, r >= min ? "Pass ✓" : "Fail ✗"), label + " (" + min + ":1)");
        stats.append(s);
      });
      const sample = $("contrast-sample"); sample.style.color = f; sample.style.background = b;
      if (r < 4.5) {
        const c = suggest(f, b);
        const btn = el("button", "btn alt", "Use " + c.toUpperCase());
        btn.onclick = () => { fg.hex.value = c; render(); };
        fix.append(el("p", "hint", "Text is too faint for normal-size text. A passing text color on this background: " + c.toUpperCase() + " (" + show(ratio(c, b)) + " : 1)."), btn);
      }
    }
    [fg, bg].forEach((c) => {
      c.pick.addEventListener("input", () => { c.hex.value = c.pick.value; render(); });
      c.hex.addEventListener("input", render);
    });
    $("contrast-swap").onclick = () => { [fg.hex.value, bg.hex.value] = [bg.hex.value, fg.hex.value]; render(); };
    render();
  }
});

// qr reader
(window.TOOLS ||= []).push({
  id: "scan", title: "QR Reader", emoji: "📷",
  desc: "Scan QR codes with your camera or from images. Joins numbered codes back together.",
  cat: "make", kw: "qr code scan read camera receive decode split file parts screenshot",
  html: `
<h2>QR Reader</h2><p class="hint">Scan codes with your camera, or choose screenshots and photos of them. Numbered codes from QR Maker ([1/3], [2/3]…) are joined back into one text file, in any order. Everything stays on your device.</p>
<div class="row"><button class="btn" id="scan-cam">Start camera</button><button class="btn alt" id="scan-reset">Start over</button></div>
<div id="scan-cam-box" hidden style="margin-top:14px;text-align:center"><video id="scan-video" playsinline muted style="max-width:100%;max-height:360px;border:2px solid var(--ink);border-radius:8px;background:#000"></video></div>
<label for="scan-file">Or choose images with codes in them</label><input type="file" id="scan-file" accept="image/*" multiple>
<label for="scan-paste">Or paste the text a code showed</label><textarea id="scan-paste" style="min-height:70px" placeholder="[1/3]&#10;first part of the text…"></textarea>
<div class="row"><button class="btn alt" id="scan-add">Add pasted text</button></div>
<p class="hint" id="scan-status" aria-live="polite" style="margin:14px 0 0">No code read yet.</p>
<div class="result pre" id="scan-out">Scanned text shows up here.</div>
<div class="row"><button class="btn" id="scan-copy" disabled>Copy</button><button class="btn alt" id="scan-dl" disabled>Download .txt</button></div>
  `,
  init() {
    const MAX_SIDE = 2400;
    let detector = null;
    try { if ("BarcodeDetector" in window) detector = new BarcodeDetector({ formats: ["qr_code"] }); } catch (e) { detector = null; }
    /* Fallback decoder for browsers without BarcodeDetector. It is only downloaded when needed. */
    let jsqrPromise = null;
    function loadJsQR() {
      if (typeof jsQR === "function") return Promise.resolve(true);
      if (!jsqrPromise) jsqrPromise = new Promise((res) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
        s.onload = () => res(typeof jsQR === "function"); s.onerror = () => { jsqrPromise = null; res(false); };
        document.head.append(s);
      });
      return jsqrPromise;
    }
    if (!detector) loadJsQR();

    const video = $("scan-video"), box = $("scan-cam-box"), camBtn = $("scan-cam"), out = $("scan-out");
    const cvs = document.createElement("canvas"), ctx = cvs.getContext("2d", { willReadFrequently: true });
    const bytesOf = (t) => new TextEncoder().encode(t).length;
    let stream = null, timer = null, busy = false, current = null;
    const parts = new Map(); let total = 0, single = null;

    function setStatus(msg) { const s = $("scan-status"); if (s.textContent !== msg) s.textContent = msg; }

    /* Read every QR code found on the canvas; returns an array of strings */
    async function decode() {
      if (detector) {
        try { const r = await detector.detect(cvs); const t = r.map((x) => x.rawValue).filter(Boolean); if (t.length) return t; }
        catch (e) { detector = null; loadJsQR(); }
      }
      if (typeof jsQR === "function") {
        const d = ctx.getImageData(0, 0, cvs.width, cvs.height);
        const c = jsQR(d.data, d.width, d.height, { inversionAttempts: "attemptBoth" });
        if (c && c.data) return [c.data];
      }
      return [];
    }
    async function canRead() { return !!detector || await loadJsQR(); }

    function render() {
      let text = null, msg = "No code read yet.";
      if (single !== null) { text = single; msg = "Read one code (" + bytesOf(single) + " bytes)."; }
      else if (total) {
        const miss = []; for (let i = 1; i <= total; i++) if (!parts.has(i)) miss.push(i);
        if (!miss.length) { text = Array.from({ length: total }, (_, i) => parts.get(i + 1)).join(""); msg = "All " + total + " parts collected ✓ (" + bytesOf(text) + " bytes)."; }
        else msg = "Collected " + parts.size + " of " + total + ". Still needed: " + miss.join(", ") + ".";
      }
      current = text;
      setStatus(msg);
      out.textContent = text !== null ? text : total ? "Waiting for the remaining parts…" : "Scanned text shows up here.";
      $("scan-copy").disabled = $("scan-dl").disabled = text === null;
      if (text !== null && stream) stopCam();                    // done: turn the camera off
    }

    function addText(t) {
      const m = /^\[(\d{1,2})\/(\d{1,2})\]\r?\n/.exec(t);
      const n = m ? +m[1] : 0, tot = m ? +m[2] : 0;
      if (!m || n < 1 || tot < 2 || n > tot) { parts.clear(); total = 0; single = t; }
      else {
        if (single !== null) { single = null; parts.clear(); total = 0; }
        if (total && tot !== total) { setStatus("That code is part " + n + " of " + tot + ", but you are collecting a set of " + total + ". Press Start over to switch."); return; }
        total = tot; parts.set(n, t.slice(m[0].length));
      }
      render();
    }

    async function startCam() {
      if (!(await canRead())) { setStatus("This browser cannot read QR codes and the backup reader did not load. Check your connection."); return; }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setStatus("Camera access is not available here (it needs https or localhost). You can still choose images or paste text."); return; }
      try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false }); }
      catch (e) { setStatus(e.name === "NotAllowedError" ? "Camera permission was denied. Allow it in your browser settings, or choose images instead." : "Could not open the camera (" + (e.name || "error") + ")."); return; }
      video.srcObject = stream; try { await video.play(); } catch (e) {}
      box.hidden = false; camBtn.textContent = "Stop camera";
      setStatus("Point the camera at a QR code.");
      timer = setInterval(tick, 200);
    }
    function stopCam() {
      clearInterval(timer); timer = null;
      if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
      video.srcObject = null; box.hidden = true; camBtn.textContent = "Start camera";
    }
    async function tick() {
      if (busy || !video.videoWidth) return;
      busy = true;
      try {
        const w = Math.min(1280, video.videoWidth), h = Math.round(video.videoHeight * w / video.videoWidth);
        cvs.width = w; cvs.height = h; ctx.drawImage(video, 0, 0, w, h);
        (await decode()).forEach(addText);
      } catch (e) { /* skip this frame */ }
      busy = false;
    }

    const loadImage = (f) => new Promise((res, rej) => { const u = URL.createObjectURL(f), i = new Image(); i.onload = () => { URL.revokeObjectURL(u); res(i); }; i.onerror = () => { URL.revokeObjectURL(u); rej(new Error("bad image")); }; i.src = u; });
    async function scanFiles(files) {
      if (!files.length) return;
      if (!(await canRead())) { setStatus("This browser cannot read QR codes and the backup reader did not load. Check your connection."); return; }
      setStatus("Reading " + files.length + (files.length === 1 ? " image…" : " images…"));
      const none = [];
      for (const f of files) {
        try {
          const img = await loadImage(f), k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
          cvs.width = Math.max(1, Math.round(img.naturalWidth * k)); cvs.height = Math.max(1, Math.round(img.naturalHeight * k));
          ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
          const found = await decode();
          if (found.length) found.forEach(addText); else none.push(f.name);
        } catch (e) { none.push(f.name); }
      }
      if (none.length) setStatus((current !== null || total ? $("scan-status").textContent + " " : "") + "No readable code in: " + none.join(", ") + ".");
    }

    camBtn.onclick = () => { if (stream) { stopCam(); setStatus($("scan-status").textContent); } else startCam(); };
    $("scan-reset").onclick = () => { parts.clear(); total = 0; single = null; render(); };
    $("scan-file").addEventListener("change", async (e) => { const fs = [...e.target.files]; await scanFiles(fs); e.target.value = ""; });
    $("scan-add").onclick = () => {
      const t = $("scan-paste").value;
      if (!t.trim()) { setStatus("Paste the text from a code first."); return; }
      addText(t); $("scan-paste").value = "";
    };
    $("scan-copy").onclick = () => { if (current !== null) copyText(current, $("scan-copy")); };
    $("scan-dl").onclick = () => {
      if (current === null) return;
      const u = URL.createObjectURL(new Blob([current], { type: "text/plain" }));
      download(u, "scanned-text.txt"); setTimeout(() => URL.revokeObjectURL(u), 1000);
    };
    /* Turn the camera off when you leave this tool or the page */
    window.addEventListener("hashchange", () => { if (location.hash !== "#scan") stopCam(); });
    window.addEventListener("pagehide", stopCam);
    render();
  }
});


// receipt maker
(window.TOOLS ||= []).push({
  id: "receipt", title: "Receipt Maker", emoji: "🛍️",
  desc: "Design a thermal-paper receipt and download it as a PNG.",
  cat: "make", kw: "receipt bill shop store price tax total thermal paper image png mockup prop design",
  html: `
<h2>Receipt Maker</h2><p class="hint">Design a thermal-paper receipt for fun, props or mockups, then download it as an image. It is not a real proof of purchase.</p>
<label for="receipt-store">Store name</label><input type="text" id="receipt-store" maxlength="40" autocomplete="off">
<label for="receipt-addr">Address or tagline (one line per row)</label><textarea id="receipt-addr" maxlength="160" style="min-height:64px"></textarea>
<label for="receipt-date">Date and time</label>
<div class="row" style="margin-top:0"><input type="text" id="receipt-date" maxlength="40" autocomplete="off" style="flex:1;min-width:0"><button class="btn alt" id="receipt-now">Now</button></div>
<label for="receipt-no">Receipt number</label><input type="text" id="receipt-no" maxlength="12" autocomplete="off">
<p class="big" id="receipt-items-h" style="margin:20px 0 0">Items</p>
<div id="receipt-rows" role="group" aria-labelledby="receipt-items-h"></div>
<div class="row"><button class="btn alt" id="receipt-add">+ Add item</button></div>
<label for="receipt-cur">Currency symbol</label><input type="text" id="receipt-cur" maxlength="4" autocomplete="off">
<label for="receipt-tax">Tax rate (%)</label><input type="number" id="receipt-tax" min="0" max="100" step="0.01" inputmode="decimal">
<label for="receipt-foot">Message at the bottom</label><input type="text" id="receipt-foot" maxlength="60" autocomplete="off">
<div class="opts"><label><input type="checkbox" id="receipt-bar" checked> Show a barcode</label></div>
<p class="hint" id="receipt-status" aria-live="polite" style="margin:14px 0 0"></p>
<div class="result center" id="receipt-out"><canvas id="receipt-canvas" role="img" aria-label="Receipt preview" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.25))"></canvas></div>
<div class="row"><button class="btn" id="receipt-dl">Download PNG</button><button class="btn alt" id="receipt-reset">Reset</button></div>
  `,
  init() {
    const W = 360, PAD = 22, INNER = W - PAD * 2, MAX_ROWS = 30;
    const MONO = '"IBM Plex Mono","Courier New",monospace', INK = "#23271f", SOFT = "#585c4e", PAPER = "#fffdf5";
    const rowsBox = $("receipt-rows"), cv = $("receipt-canvas"), status = $("receipt-status");
    const scratch = document.createElement("canvas").getContext("2d");
    let token = 0, timer = 0;

    const cents = (v) => { const n = parseFloat(String(v).replace(",", ".")); return isFinite(n) && n >= 0 && n < 1e7 ? Math.round(n * 100) : null; };
    const nowText = () => new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    const newNo = () => String(secureInt(900000) + 100000);

    /* ----- item rows ----- */
    function relabel() {
      [...rowsBox.children].forEach((row, i) => {
        const [n, q, p] = row.querySelectorAll("input"), b = row.querySelector("button");
        n.setAttribute("aria-label", "Item " + (i + 1) + " name"); q.setAttribute("aria-label", "Item " + (i + 1) + " quantity");
        p.setAttribute("aria-label", "Item " + (i + 1) + " price"); b.setAttribute("aria-label", "Remove item " + (i + 1));
      });
      $("receipt-add").disabled = rowsBox.children.length >= MAX_ROWS;
    }
    function addRow(name, qty, price) {
      const row = document.createElement("div");
      row.style.cssText = "display:grid;grid-template-columns:minmax(0,1fr) 62px 84px 44px;gap:8px;margin-top:8px";
      const mkIn = (type, val, ph, extra) => { const i = document.createElement("input"); i.type = type; i.value = val; i.placeholder = ph; i.autocomplete = "off"; i.style.padding = "8px"; Object.assign(i, extra || {}); return i; };
      const n = mkIn("text", name, "Item", { maxLength: 40 });
      const q = mkIn("number", qty, "Qty", { min: "1", max: "999", step: "1" }); q.inputMode = "numeric";
      const p = mkIn("number", price, "0.00", { min: "0", step: "0.01" }); p.inputMode = "decimal";
      const b = document.createElement("button"); b.type = "button"; b.className = "btn alt"; b.textContent = "✕"; b.style.cssText = "margin:0;padding:4px";
      b.onclick = () => {
        if (rowsBox.children.length === 1) { n.value = ""; q.value = "1"; p.value = ""; }
        else row.remove();
        relabel(); schedule();
      };
      row.append(n, q, p, b); rowsBox.append(row); relabel();
    }

    /* ----- read the form ----- */
    function model() {
      const c0 = $("receipt-cur").value.trim().slice(0, 4), cur = c0 + (c0.length > 1 && /[A-Za-z]$/.test(c0) ? " " : "");
      const items = [], bad = [];
      [...rowsBox.children].forEach((row, i) => {
        const [n, q, p] = row.querySelectorAll("input"), name = n.value.trim(), pr = p.value.trim();
        if (!name && !pr) return;
        const c = cents(pr);
        if (c === null) { bad.push(i + 1); return; }
        items.push({ name: name || "Item", qty: Math.min(999, Math.max(1, parseInt(q.value, 10) || 1)), unit: c });
      });
      const sub = items.reduce((s, it) => s + it.qty * it.unit, 0);
      const rate = Math.min(100, Math.max(0, parseFloat($("receipt-tax").value) || 0)), tax = Math.round(sub * rate / 100);
      return {
        store: $("receipt-store").value.trim() || "Store", addr: $("receipt-addr").value.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 4),
        date: $("receipt-date").value.trim(), no: $("receipt-no").value.trim(), foot: $("receipt-foot").value.trim(),
        bar: $("receipt-bar").checked, items, bad, sub, rate, tax, total: sub + tax,
        money: (c) => cur + (c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      };
    }

    /* ----- lay out the paper as a list of drawing commands ----- */
    const fontOf = (px, bold) => (bold ? "600 " : "500 ") + px + "px " + MONO;
    function wrap(txt, px, bold, maxW) {
      scratch.font = fontOf(px, bold);
      const out = [];
      String(txt).split("\n").forEach((par) => {
        const words = par.split(/\s+/).filter(Boolean);
        if (!words.length) { out.push(""); return; }
        let line = "";
        words.forEach((w) => {
          const t = line ? line + " " + w : w;
          if (scratch.measureText(t).width <= maxW) { line = t; return; }
          if (line) out.push(line);
          line = "";
          for (const ch of w) { const t2 = line + ch; if (line && scratch.measureText(t2).width > maxW) { out.push(line); line = ch; } else line = t2; }
        });
        out.push(line);
      });
      return out;
    }
    function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0 || 1; }
    function build(m) {
      const cmds = []; let y = 30;
      const text = (txt, x, px, bold, align, color, lh) => { cmds.push({ t: "text", txt, x, y: y + lh / 2, px, bold, align, color }); y += lh; };
      const centered = (txt, px, bold, lh, color) => wrap(txt, px, bold, INNER).forEach((l) => text(l, W / 2, px, bold, "center", color || INK, lh));
      const rule = (kind) => { y += 8; cmds.push({ t: kind || "rule", y }); y += 12; };
      const pair = (a, b, px, bold, lh) => { cmds.push({ t: "text", txt: a, x: PAD, y: y + lh / 2, px, bold, align: "left", color: INK }); cmds.push({ t: "text", txt: b, x: W - PAD, y: y + lh / 2, px, bold, align: "right", color: INK }); y += lh; };
      centered(m.store.toUpperCase(), 22, true, 28);
      y += 4; m.addr.forEach((l) => centered(l, 13, false, 18, SOFT));
      rule();
      if (m.date) centered(m.date, 13, false, 18);
      if (m.no) centered("RECEIPT #" + m.no, 13, false, 18);
      rule();
      pair("ITEM", "AMOUNT", 13, true, 20); y += 4;
      m.items.forEach((it) => {
        const price = m.money(it.qty * it.unit);
        scratch.font = fontOf(14, false);
        const pw = scratch.measureText(price).width;
        const lines = wrap((it.qty > 1 ? it.qty + " x " : "") + it.name, 14, false, INNER - pw - 14);
        lines.forEach((l, i) => {
          cmds.push({ t: "text", txt: l, x: PAD, y: y + 10, px: 14, bold: false, align: "left", color: INK });
          if (i === 0) cmds.push({ t: "text", txt: price, x: W - PAD, y: y + 10, px: 14, bold: false, align: "right", color: INK });
          y += 20;
        });
        if (it.qty > 1) text("   @ " + m.money(it.unit) + " each", PAD, 12, false, "left", SOFT, 16);
      });
      rule();
      pair("SUBTOTAL", m.money(m.sub), 14, false, 22);
      if (m.rate > 0) pair("TAX " + (+m.rate.toFixed(2)) + "%", m.money(m.tax), 14, false, 22);
      y += 4; cmds.push({ t: "dbl", y }); y += 10;
      pair("TOTAL", m.money(m.total), 19, true, 30);
      rule();
      if (m.foot) { y += 2; centered(m.foot, 13, false, 18); y += 6; }
      if (m.bar) {
        y += 8;
        let seed = hash(m.no + "|" + m.total + "|" + m.store), units = 0; const widths = [];
        while (units < 90) { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; const w = 1 + (seed % 3); widths.push(w); units += w; }
        cmds.push({ t: "bars", y, h: 46, widths, units }); y += 52;
        if (m.no) { y += 2; text(m.no.split("").join(" "), W / 2, 12, false, "center", SOFT, 16); }
      }
      return { cmds, H: Math.ceil(y + 34) };
    }

    /* ----- paint ----- */
    async function render() {
      const me = ++token, m = model();
      const dl = $("receipt-dl");
      if (!m.items.length) {
        cv.hidden = true; dl.disabled = true;
        status.textContent = m.bad.length ? "Item " + m.bad.join(", ") + " needs a price like 3.50." : "Add at least one item with a price.";
        return;
      }
      try { if (document.fonts && document.fonts.load) await Promise.all([document.fonts.load('500 14px "IBM Plex Mono"'), document.fonts.load('600 14px "IBM Plex Mono"')]); } catch (e) { /* use the fallback font */ }
      if (me !== token) return;
      const { cmds, H } = build(m), S = Math.min(3, Math.max(2, Math.ceil(window.devicePixelRatio || 1)));
      cv.width = W * S; cv.height = H * S; cv.style.width = W + "px"; cv.hidden = false;
      const x = cv.getContext("2d"); x.setTransform(S, 0, 0, S, 0, 0); x.clearRect(0, 0, W, H);
      const step = 10, n = Math.ceil(W / step);
      x.beginPath(); x.moveTo(0, 6);
      for (let i = 1; i <= n; i++) x.lineTo(Math.min(i * step, W), i % 2 ? 0 : 6);
      for (let i = n; i >= 0; i--) x.lineTo(Math.min(i * step, W), H - (i % 2 ? 0 : 6));
      x.closePath(); x.fillStyle = PAPER; x.fill(); x.strokeStyle = "rgba(35,39,31,.22)"; x.lineWidth = 1; x.stroke();
      x.textBaseline = "middle";
      cmds.forEach((c) => {
        if (c.t === "text") { x.font = fontOf(c.px, c.bold); x.fillStyle = c.color; x.textAlign = c.align; x.fillText(c.txt, c.x, c.y); }
        else if (c.t === "rule") { x.setLineDash([4, 4]); x.strokeStyle = SOFT; x.lineWidth = 1; x.beginPath(); x.moveTo(PAD, c.y); x.lineTo(W - PAD, c.y); x.stroke(); x.setLineDash([]); }
        else if (c.t === "dbl") { x.strokeStyle = INK; x.lineWidth = 1; [0, 4].forEach((o) => { x.beginPath(); x.moveTo(PAD, c.y + o); x.lineTo(W - PAD, c.y + o); x.stroke(); }); }
        else if (c.t === "bars") {
          const bw = INNER - 40, u = bw / c.units; let px = (W - bw) / 2; x.fillStyle = INK;
          c.widths.forEach((w, i) => { if (i % 2 === 0) x.fillRect(px, c.y, w * u, c.h); px += w * u; });
        }
      });
      dl.disabled = false;
      const count = m.items.reduce((s, it) => s + it.qty, 0);
      cv.setAttribute("aria-label", "Receipt from " + m.store + ": " + count + (count === 1 ? " item" : " items") + ", total " + m.money(m.total));
      status.textContent = count + (count === 1 ? " item" : " items") + " · subtotal " + m.money(m.sub) + " · total " + m.money(m.total) + (m.bad.length ? ". Item " + m.bad.join(", ") + " needs a price like 3.50 and was left out." : "");
    }
    function schedule() { clearTimeout(timer); timer = setTimeout(render, 150); }

    function defaults() {
      $("receipt-store").value = "Twatos Corner Shop"; $("receipt-addr").value = "12 Kraft Paper Lane\nPetaling Jaya";
      $("receipt-date").value = nowText(); $("receipt-no").value = newNo(); $("receipt-cur").value = "$"; $("receipt-tax").value = "6";
      $("receipt-foot").value = "Thank you! Come again."; $("receipt-bar").checked = true;
      rowsBox.textContent = "";
      addRow("Flat white", "2", "4.50"); addRow("Banana bread", "1", "3.80"); addRow("Reusable cup", "1", "12.00");
      render();
    }

    $("panel-receipt").addEventListener("input", schedule);
    $("panel-receipt").addEventListener("change", schedule);
    $("receipt-add").onclick = () => { if (rowsBox.children.length < MAX_ROWS) { addRow("", "1", ""); rowsBox.lastChild.querySelector("input").focus(); schedule(); } };
    $("receipt-now").onclick = () => { $("receipt-date").value = nowText(); schedule(); };
    $("receipt-reset").onclick = defaults;
    $("receipt-dl").onclick = () => {
      cv.toBlob((b) => {
        if (!b) { status.textContent = "This browser could not create the image."; return; }
        const u = URL.createObjectURL(b); download(u, "receipt.png"); setTimeout(() => URL.revokeObjectURL(u), 1000);
      }, "image/png");
    };
    defaults();
  }
});

// ascii banner
(window.TOOLS ||= []).push({
  id: "ascii", title: "ASCII Banner", emoji: "🖥️",
  desc: "Turn text into big retro terminal letters, with optional frames.",
  cat: "make", kw: "ascii text art banner terminal retro header block letters figlet comment readme console",
  html: `
<h2>ASCII Banner</h2><p class="hint">Type a short title and get big block letters you can paste into a README, a terminal or a code comment.</p>
<label for="ascii-in">Your text (up to 4 lines)</label><textarea id="ascii-in" maxlength="120" style="min-height:70px">TWATOS TOOLS</textarea>
<label for="ascii-fill">Letter style</label>
<select id="ascii-fill"><option value="█" selected>█ Solid blocks</option><option value="▓">▓ Dark shade</option><option value="▒">▒ Medium shade</option><option value="░">░ Light shade</option><option value="#"># Hash</option><option value="@">@ At sign</option><option value="*">* Star</option><option value="=">= Equals</option><option value="+">+ Plus</option><option value="o">o Letter o</option></select>
<label for="ascii-custom">Or your own character (optional)</label><input type="text" id="ascii-custom" maxlength="2" autocomplete="off" style="max-width:120px">
<label for="ascii-size">Size</label>
<select id="ascii-size"><option value="1">Compact (1 wide, 1 tall)</option><option value="2" selected>Normal (2 wide, 1 tall)</option><option value="3">Large (2 wide, 2 tall)</option></select>
<label for="ascii-frame">Frame</label>
<select id="ascii-frame"><option value="none">No frame</option><option value="box2">Double line box</option><option value="box1">Single line box</option><option value="plus">Plain ASCII box</option><option value="hash">Hash border</option><option value="block">Code comment /* */</option><option value="slash">Line comment //</option><option value="pound">Line comment #</option></select>
<label for="ascii-align">Align</label><select id="ascii-align"><option value="left">Left</option><option value="center" selected>Center</option><option value="right">Right</option></select>
<label for="ascii-wrap">Wrap at</label><select id="ascii-wrap"><option value="0">Do not wrap</option><option value="40">40 columns</option><option value="60">60 columns</option><option value="80" selected>80 columns</option><option value="120">120 columns</option></select>
<p class="hint" id="ascii-status" aria-live="polite" style="margin:14px 0 0"></p>
<div class="result" id="ascii-out" tabindex="0" role="region" aria-label="ASCII banner preview" style="white-space:pre;overflow-x:auto;word-break:normal;font-family:ui-monospace,'Cascadia Mono','Courier New',monospace;font-size:.78rem;line-height:1.1"></div>
<div class="row"><button class="btn" id="ascii-copy" disabled>Copy</button><button class="btn alt" id="ascii-dl" disabled>Download .txt</button></div>
  `,
  init() {
    /* A 5x7 pixel font. Each glyph is 7 rows separated by "/"; "#" is ink. */
    const G = {};
    const def = (chars, rows) => { const g = rows.split("/"); chars.split("").forEach((c) => { G[c] = g; }); };
    def("A", ".###./#...#/#...#/#####/#...#/#...#/#...#"); def("B", "####./#...#/#...#/####./#...#/#...#/####.");
    def("C", ".###./#...#/#..../#..../#..../#...#/.###."); def("D", "####./#...#/#...#/#...#/#...#/#...#/####.");
    def("E", "#####/#..../#..../####./#..../#..../#####"); def("F", "#####/#..../#..../####./#..../#..../#....");
    def("G", ".###./#...#/#..../#.###/#...#/#...#/.###."); def("H", "#...#/#...#/#...#/#####/#...#/#...#/#...#");
    def("I", ".###./..#../..#../..#../..#../..#../.###."); def("J", "..###/...#./...#./...#./...#./#..#./.##..");
    def("K", "#...#/#..#./#.#../##.../#.#../#..#./#...#"); def("L", "#..../#..../#..../#..../#..../#..../#####");
    def("M", "#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#"); def("N", "#...#/##..#/#.#.#/#..##/#...#/#...#/#...#");
    def("O", ".###./#...#/#...#/#...#/#...#/#...#/.###."); def("P", "####./#...#/#...#/####./#..../#..../#....");
    def("Q", ".###./#...#/#...#/#...#/#.#.#/#..#./.##.#"); def("R", "####./#...#/#...#/####./#.#../#..#./#...#");
    def("S", ".####/#..../#..../.###./....#/....#/####."); def("T", "#####/..#../..#../..#../..#../..#../..#..");
    def("U", "#...#/#...#/#...#/#...#/#...#/#...#/.###."); def("V", "#...#/#...#/#...#/#...#/#...#/.#.#./..#..");
    def("W", "#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#"); def("X", "#...#/#...#/.#.#./..#../.#.#./#...#/#...#");
    def("Y", "#...#/#...#/.#.#./..#../..#../..#../..#.."); def("Z", "#####/....#/...#./..#../.#.../#..../#####");
    def("0", ".###./#...#/#..##/#.#.#/##..#/#...#/.###."); def("1", "..#../.##../..#../..#../..#../..#../.###.");
    def("2", ".###./#...#/....#/...#./..#../.#.../#####"); def("3", ".###./#...#/....#/..##./....#/#...#/.###.");
    def("4", "...#./..##./.#.#./#..#./#####/...#./...#."); def("5", "#####/#..../####./....#/....#/#...#/.###.");
    def("6", ".###./#..../#..../####./#...#/#...#/.###."); def("7", "#####/....#/...#./..#../.#.../.#.../.#...");
    def("8", ".###./#...#/#...#/.###./#...#/#...#/.###."); def("9", ".###./#...#/#...#/.####/....#/....#/.###.");
    def(" ", ".../.../.../.../.../.../..."); def("!", "#/#/#/#/#/./#"); def(".", "./././././././#"); def(",", "../../../../../.#/#.");
    def("-", "...../...../...../#####/...../...../....."); def(":", "./#/././././#/."); def("?", ".###./#...#/....#/..##./..#../...../..#..");
    def("'", "#/#/././././."); def('"', "#.#/#.#/.../.../.../.../..."); def("+", "...../..#../..#../#####/..#../..#../.....");
    def("=", "...../...../#####/...../#####/...../....."); def("/", "....#/....#/...#./..#../.#.../#..../#....");
    def("(", "..#/.#./#../#../#../.#./..#"); def(")", "#../.#./..#/..#/..#/.#./#.."); def("_", "...../...../...../...../...../...../#####");
    def("&", ".##../#..#./#.#../.#.../#.#.#/#..#./.##.#"); def("#", ".#.#./.#.#./#####/.#.#./#####/.#.#./.#.#.");
    def("@", ".###./#...#/#.###/#.#.#/#.##./#..../.###."); def("*", "...../#.#.#/.###./#####/.###./#.#.#/.....");
    const MAX_CHARS = 120, MAX_LINES = 4;
    let current = "";

    const FRAMES = { box2: "╔═╗║╚╝", box1: "┌─┐│└┘", plus: "+-+|++", hash: "######" };
    function render() {
      const raw = $("ascii-in").value, status = $("ascii-status"), box = $("ascii-out");
      const fill = Array.from($("ascii-custom").value.trim())[0] || $("ascii-fill").value;
      const sz = +$("ascii-size").value, xs = sz === 1 ? 1 : 2, ys = sz === 3 ? 2 : 1, wrapAt = +$("ascii-wrap").value;
      const inLines = raw.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, MAX_LINES);
      current = "";
      $("ascii-copy").disabled = $("ascii-dl").disabled = true;
      if (!inLines.length) { box.textContent = ""; status.textContent = "Type something to see it here."; return; }
      let unknown = 0;
      const glyph = (ch) => { const g = G[ch.toUpperCase()]; if (g) return g; unknown++; return G["?"]; };
      const gw = (ch) => G[ch.toUpperCase()] ? G[ch.toUpperCase()][0].length : 5;
      const fillStr = (ch) => ch.repeat(xs), blank = " ".repeat(xs);
      const textWidth = (s) => Array.from(s).reduce((w, ch) => w + (gw(ch) + 1) * xs, 0);
      /* break a line into pieces that fit the wrap width (at spaces, or inside a long word) */
      function pieces(line) {
        if (!wrapAt || textWidth(line) <= wrapAt) return [line];
        const out = []; let cur = "";
        line.split(/\s+/).forEach((word) => {
          const t = cur ? cur + " " + word : word;
          if (textWidth(t) <= wrapAt) { cur = t; return; }
          if (cur) out.push(cur);
          cur = "";
          for (const ch of word) { if (cur && textWidth(cur + ch) > wrapAt) { out.push(cur); cur = ch; } else cur += ch; }
        });
        if (cur) out.push(cur);
        return out;
      }
      const rows = [];
      inLines.forEach((line, li) => {
        pieces(line).forEach((piece, pi) => {
          if (rows.length) rows.push("");
          for (let r = 0; r < 7; r++) {
            let s = "";
            for (const ch of Array.from(piece)) {
              const g = glyph(ch)[r];
              for (const p of g) s += p === "#" ? fillStr(fill) : blank;
              s += blank;
            }
            s = s.replace(/\s+$/, "");
            for (let k = 0; k < ys; k++) rows.push(s);
          }
        });
      });
      const width = Math.max(...rows.map((r) => Array.from(r).length));
      const al = $("ascii-align").value;
      const aligned = rows.map((r) => {
        const len = Array.from(r).length, gap = width - len;
        return al === "center" ? " ".repeat(Math.floor(gap / 2)) + r + " ".repeat(Math.ceil(gap / 2)) : al === "right" ? " ".repeat(gap) + r : r + " ".repeat(gap);
      });
      const frame = $("ascii-frame").value;
      let out;
      if (frame === "none") out = aligned.map((r) => r.replace(/\s+$/, ""));
      else if (FRAMES[frame]) {
        const [tl, h, tr, v, bl, br] = Array.from(FRAMES[frame]), inner = width + 4;
        out = [tl + h.repeat(inner) + tr, v + " ".repeat(inner) + v, ...aligned.map((r) => v + "  " + r + "  " + v), v + " ".repeat(inner) + v, bl + h.repeat(inner) + br];
      } else if (frame === "block") out = ["/*", ...aligned.map((r) => (" * " + r).replace(/\s+$/, "")), " */"];
      else out = aligned.map((r) => ((frame === "slash" ? "// " : "# ") + r).replace(/\s+$/, ""));
      current = out.join("\n");
      box.textContent = current;
      $("ascii-copy").disabled = $("ascii-dl").disabled = false;
      box.setAttribute("aria-label", "ASCII banner of the text: " + inLines.join(", "));
      status.textContent = out.length + " rows by " + Math.max(...out.map((r) => Array.from(r).length)) + " columns." + (unknown ? " " + unknown + " unsupported character" + (unknown > 1 ? "s were" : " was") + " shown as ?." : "") + (raw.length >= MAX_CHARS ? " Text is limited to " + MAX_CHARS + " characters." : "");
    }
    ["ascii-in", "ascii-fill", "ascii-custom", "ascii-size", "ascii-frame", "ascii-align", "ascii-wrap"].forEach((id) => $(id).addEventListener("input", render));
    $("ascii-copy").onclick = () => { if (current) copyText(current, $("ascii-copy")); };
    $("ascii-dl").onclick = () => {
      if (!current) return;
      const u = URL.createObjectURL(new Blob([current + "\n"], { type: "text/plain" })); download(u, "banner.txt"); setTimeout(() => URL.revokeObjectURL(u), 1000);
    };
    render();
  }
});

// noise machine
(window.TOOLS ||= []).push({
  id: "noise", title: "Noise Machine", emoji: "🎧",
  desc: "Pink, brown and white noise or binaural tones, made live with no audio files.",
  cat: "make", kw: "noise sound ambient focus sleep pink brown white binaural audio rain relax study webaudio",
  html: `
<h2>Noise Machine</h2><p class="hint">Steady background sound for focus or sleep, made live in your browser. Start quiet and raise the volume slowly. Binaural tones only work with headphones.</p>
<label for="noise-type">Sound</label>
<select id="noise-type"><option value="pink">Pink noise (balanced, like steady rain)</option><option value="brown">Brown noise (deep, like a waterfall)</option><option value="white">White noise (bright hiss)</option><option value="binaural">Binaural tones (headphones needed)</option></select>
<div id="noise-bin" hidden>
<label for="noise-beat">Target state</label>
<select id="noise-beat"><option value="2">Deep rest · delta · 2 Hz</option><option value="6">Calm · theta · 6 Hz</option><option value="10" selected>Relaxed focus · alpha · 10 Hz</option><option value="18">Alert focus · beta · 18 Hz</option></select>
<label for="noise-carrier">Base tone: <span id="noise-carrier-val">200</span> Hz</label><input type="range" id="noise-carrier" min="100" max="400" step="10" value="200">
</div>
<label for="noise-vol">Volume: <span id="noise-vol-val">30</span>%</label><input type="range" id="noise-vol" min="0" max="100" value="30">
<label for="noise-sleep">Stop after</label>
<select id="noise-sleep"><option value="0">Keep playing</option><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">1 hour</option></select>
<div class="row"><button class="btn" id="noise-go" aria-pressed="false">▶ Play</button></div>
<p class="hint" id="noise-status" aria-live="polite" style="margin-top:12px">Stopped.</p>
<p class="hint">The sound keeps playing if you open another tool, like Focus Timer. Come back here to stop it. Binaural beats may not work for everyone.</p>
  `,
  init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    const go = $("noise-go"), status = $("noise-status"), typeSel = $("noise-type");
    if (!AC) { go.disabled = true; status.textContent = "This browser does not support Web Audio, so sounds cannot play here."; return; }
    let ctx = null, master = null, voice = null, playing = false, sleepTimer = 0;
    const cache = {};
    const NAMES = { pink: "pink noise", brown: "brown noise", white: "white noise", binaural: "binaural tones" };

    /* Ten seconds of stereo noise, with the end blended into the start so the loop has no click */
    function noiseBuffer(type) {
      if (cache[type]) return cache[type];
      const sr = ctx.sampleRate, len = sr * 10, xf = Math.floor(sr * 0.5), total = len + xf;
      const buf = ctx.createBuffer(2, len, sr);
      for (let ch = 0; ch < 2; ch++) {
        const t = new Float32Array(total);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
        for (let i = 0; i < total; i++) {
          const w = Math.random() * 2 - 1; let v;
          if (type === "white") v = w;
          else if (type === "pink") {                        // Paul Kellet's pink filter
            b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
            b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
            v = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926;
          } else { last = (last + 0.02 * w) / 1.02; v = last * 3.5; }   // brown: a leaky random walk
          t[i] = v;
        }
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = t[i];
        for (let i = 0; i < xf; i++) { const a = i / xf; d[i] = t[i] * Math.sin(a * Math.PI / 2) + t[len + i] * Math.cos(a * Math.PI / 2); }
        let sum = 0; for (let i = 0; i < len; i++) sum += d[i] * d[i];
        const rms = Math.sqrt(sum / len), k = rms ? 0.15 / rms : 1;     // same loudness for every sound
        for (let i = 0; i < len; i++) d[i] = Math.max(-0.98, Math.min(0.98, d[i] * k));
      }
      return (cache[type] = buf);
    }

    function startVoice() {
      const type = typeSel.value, g = ctx.createGain(), nodes = [];
      g.gain.value = 0; g.connect(master);
      const v = { g, nodes, type };
      if (type === "binaural") {
        const merger = ctx.createChannelMerger(2); merger.connect(g);
        const base = +$("noise-carrier").value, beat = +$("noise-beat").value;
        [base, base + beat].forEach((f, ch) => {
          const o = ctx.createOscillator(), og = ctx.createGain();
          o.type = "sine"; o.frequency.value = f; og.gain.value = 0.35;
          o.connect(og); og.connect(merger, 0, ch); o.start(); nodes.push(o);
          if (ch === 0) v.l = o; else v.r = o;
        });
      } else {
        const s = ctx.createBufferSource(); s.buffer = noiseBuffer(type); s.loop = true; s.connect(g); s.start(); nodes.push(s);
      }
      g.gain.setTargetAtTime(1, ctx.currentTime, 0.15);
      return v;
    }
    function stopVoice(v, fast) {
      if (!v) return;
      const now = ctx.currentTime;
      v.g.gain.cancelScheduledValues(now); v.g.gain.setTargetAtTime(0, now, fast ? 0.05 : 0.25);
      setTimeout(() => { v.nodes.forEach((n) => { try { n.stop(); } catch (e) { /* already stopped */ } }); try { v.g.disconnect(); } catch (e) { /* ignore */ } }, fast ? 500 : 2000);
    }
    const setVolume = () => { if (master) master.gain.setTargetAtTime(Math.pow(+$("noise-vol").value / 100, 1.6), ctx.currentTime, 0.05); };

    function describe() {
      const type = typeSel.value, min = +$("noise-sleep").value;
      let s = "Playing " + NAMES[type] + " at " + $("noise-vol").value + "%.";
      if (type === "binaural") { const base = +$("noise-carrier").value, beat = +$("noise-beat").value; s = "Playing binaural tones: " + base + " Hz in the left ear, " + (base + beat) + " Hz in the right (" + beat + " Hz beat). Use headphones."; }
      return s + (min ? " Stops in " + (min === 60 ? "1 hour" : min + " minutes") + "." : "");
    }
    function ui(msg) {
      go.textContent = playing ? "■ Stop" : "▶ Play"; go.setAttribute("aria-pressed", String(playing));
      status.textContent = msg || (playing ? describe() : "Stopped.");
    }
    function armTimer() {
      clearTimeout(sleepTimer);
      const min = +$("noise-sleep").value;
      if (playing && min) sleepTimer = setTimeout(() => { stop(); ui("Stopped. The timer ended."); }, min * 60000);
    }
    async function play() {
      if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination); }
      try { await ctx.resume(); } catch (e) { /* the browser may still allow playback */ }
      setVolume(); voice = startVoice(); playing = true; armTimer(); ui();
    }
    function stop() { stopVoice(voice); voice = null; playing = false; clearTimeout(sleepTimer); ui(); }

    function syncBin() { $("noise-bin").hidden = typeSel.value !== "binaural"; }
    function retune() {
      if (!voice || !voice.l) return;
      const base = +$("noise-carrier").value, beat = +$("noise-beat").value, now = ctx.currentTime;
      voice.l.frequency.setTargetAtTime(base, now, 0.05); voice.r.frequency.setTargetAtTime(base + beat, now, 0.05);
    }
    go.onclick = () => { if (playing) stop(); else play(); };
    typeSel.addEventListener("change", () => { syncBin(); if (playing) { stopVoice(voice, true); voice = startVoice(); ui(); } });
    $("noise-beat").addEventListener("change", () => { retune(); if (playing) ui(); });
    $("noise-carrier").addEventListener("input", () => { $("noise-carrier-val").textContent = $("noise-carrier").value; retune(); if (playing) ui(); });
    $("noise-vol").addEventListener("input", () => { $("noise-vol-val").textContent = $("noise-vol").value; setVolume(); if (playing) ui(); });
    $("noise-sleep").addEventListener("change", () => { armTimer(); if (playing) ui(); });
    window.addEventListener("pagehide", () => { if (ctx) ctx.close().catch(() => {}); });
    syncBin();
  }
});
