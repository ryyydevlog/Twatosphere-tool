// convert: tools that transform whatever you give them

// image flipper
(window.TOOLS ||= []).push({
  id: "img", title: "Image Flipper", emoji: "🖼️",
  desc: "Convert PNG, JPG and WebP without uploading anywhere.",
  cat: "convert", kw: "file png jpg webp photo picture download",
  html: `
<h2>Image Flipper</h2><p class="hint">Pick an image and a format, convert, then download. Nothing leaves your device.</p>
<label for="img-file">Image file</label><input type="file" id="img-file" accept="image/*">
<label for="img-fmt">Convert to</label><select id="img-fmt"><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select>
<div id="img-q-wrap" hidden><label for="img-q">Quality: <span id="img-q-val">92%</span></label><input type="range" id="img-q" min="40" max="100" value="92"></div>
<div class="row"><button class="btn" id="img-go">Convert</button><button class="btn alt" id="img-dl" disabled>Download</button></div>
<div class="result" id="img-out" aria-live="polite">Your converted image shows up here.</div>
  `,
  init() {
    let url = null, base = "image";
    const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
    const size = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";
    const fmt = $("img-fmt"), out = $("img-out"), dl = $("img-dl");
    function sync() { $("img-q-wrap").hidden = fmt.value === "image/png"; $("img-q-val").textContent = $("img-q").value + "%"; }
    function convert() {
      const f = $("img-file").files[0];
      dl.disabled = true;
      if (!f) { out.textContent = "Choose an image file first."; return; }
      base = f.name.replace(/\.[^.]+$/, "") || "image";
      const src = URL.createObjectURL(f), img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
        const x = c.getContext("2d");
        if (fmt.value === "image/jpeg") { x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); }  // only JPG lacks transparency
        x.drawImage(img, 0, 0); URL.revokeObjectURL(src);
        c.toBlob((b) => {
          if (!b) { out.textContent = "This browser cannot export that format. Try PNG or JPG."; return; }
          if (url) URL.revokeObjectURL(url);
          url = URL.createObjectURL(b);
          out.innerHTML = "";
          const r = document.createElement("img"); r.src = url; r.alt = "Converted image";
          const p = document.createElement("p");
          p.textContent = img.naturalWidth + "×" + img.naturalHeight + "px · " + size(f.size) + " → " + size(b.size);
          out.append(r, p); dl.disabled = false;
        }, fmt.value, $("img-q").value / 100);
      };
      img.onerror = () => { URL.revokeObjectURL(src); out.textContent = "That file could not be read as an image."; };
      img.src = src;
    }
    $("img-go").onclick = convert;
    $("img-file").addEventListener("change", convert);
    fmt.addEventListener("change", () => { sync(); if ($("img-file").files[0]) convert(); });
    $("img-q").addEventListener("input", sync);
    $("img-q").addEventListener("change", () => { if ($("img-file").files[0]) convert(); });
    dl.onclick = () => download(url, base + "." + EXT[fmt.value]);
    sync();
  }
});

// word counter
(window.TOOLS ||= []).push({
  id: "words", title: "Word Counter", emoji: "📏",
  desc: "Words, letters, sentences, reading time and top words.",
  cat: "convert", kw: "count text length characters paragraphs",
  html: `
<h2>Word Counter</h2><p class="hint">Paste or type below. The numbers update live.</p>
<label for="words-in">Your text</label><textarea id="words-in" placeholder="Start typing here..." style="min-height:160px"></textarea>
<div class="stats" id="words-out"></div>
<p class="hint" id="words-top" style="margin-top:14px"></p>
<div class="row"><button class="btn" id="words-copy">Copy text</button><button class="btn alt" id="words-clear">Clear</button></div>
  `,
  init() {
    const STOP = new Set("the and for are but not you all can had her was one our out has have that with this from they will would there their what about which when your said them been were into than then some could other these".split(" "));
    function countWords() {
      const t = $("words-in").value, ws = t.split(/\s+/).filter(Boolean), n = ws.length;
      const sentences = (t.match(/[.!?]+(\s|$)/g) || []).length;
      const paras = t.split(/\n\s*\n/).filter((s) => s.trim()).length;
      const secs = Math.ceil(n / 200 * 60);                       // about 200 words per minute
      const read = secs < 60 ? secs + " sec" : Math.round(secs / 60) + " min";
      const stat = (v, l) => "<div class='stat'><b>" + v + "</b>" + l + "</div>";
      $("words-out").innerHTML = stat(n, "words") + stat(t.length, "characters") + stat(t.replace(/\s/g, "").length, "no spaces") + stat(sentences, "sentences") + stat(paras, "paragraphs") + stat(read, "to read");
      const freq = {};
      (t.toLowerCase().match(/\p{L}{4,}/gu) || []).forEach((w) => { if (!STOP.has(w)) freq[w] = (freq[w] || 0) + 1; });
      const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w, c]) => w + " (" + c + ")");
      $("words-top").textContent = top.length ? "Top words: " + top.join(", ") : "";
    }
    $("words-in").addEventListener("input", countWords);
    $("words-copy").onclick = () => copyText($("words-in").value, $("words-copy"));
    $("words-clear").onclick = () => { $("words-in").value = ""; countWords(); $("words-in").focus(); };
    countWords();
  }
});

// case converter
(window.TOOLS ||= []).push({
  id: "case", title: "Case Converter", emoji: "🔠",
  desc: "UPPER, lower, Title, camelCase, snake_case and more.",
  cat: "convert", kw: "uppercase lowercase title camel snake kebab text",
  html: `
<h2>Case Converter</h2><p class="hint">Paste text, pick a style, copy the result.</p>
<label for="case-in">Your text</label><textarea id="case-in">the quick brown fox jumps over the lazy dog</textarea>
<label for="case-mode">Style</label><select id="case-mode"><option value="upper">UPPER CASE</option><option value="lower">lower case</option><option value="title" selected>Title Case</option><option value="sentence">Sentence case</option><option value="camel">camelCase</option><option value="snake">snake_case</option><option value="kebab">kebab-case</option></select>
<div class="result big pre" id="case-out" aria-live="polite"></div>
<div class="row"><button class="btn" id="case-copy">Copy</button></div>
  `,
  init() {
    const words = (t) => t.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
    const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
    const modes = {
      upper: (t) => t.toUpperCase(),
      lower: (t) => t.toLowerCase(),
      title: (t) => t.toLowerCase().replace(/(^|[\s(\["-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()),
      sentence: (t) => t.toLowerCase().replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (m, a, b) => a + b.toUpperCase()),
      camel: (t) => words(t).map((w, i) => i ? cap(w) : w).join(""),
      snake: (t) => words(t).join("_"),
      kebab: (t) => words(t).join("-")
    };
    const render = () => { $("case-out").textContent = modes[$("case-mode").value]($("case-in").value); };
    $("case-in").addEventListener("input", render);
    $("case-mode").addEventListener("change", render);
    $("case-copy").onclick = () => copyText($("case-out").textContent, $("case-copy"));
    render();
  }
});
