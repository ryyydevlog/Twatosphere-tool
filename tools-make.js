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
<label for="qr-text">Text or link</label><textarea id="qr-text" style="min-height:90px">https://example.com</textarea>
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