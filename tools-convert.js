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


// json formatter
(window.TOOLS ||= []).push({
  id: "json", title: "JSON Formatter", emoji: "🧾",
  desc: "Check, tidy up or minify JSON, with errors pinned to a line and column.",
  cat: "convert", kw: "json validate validator format pretty print minify beautify lint parse sort keys",
  html: `
<h2>JSON Formatter</h2><p class="hint">Paste JSON to check it, tidy it up or squash it small. Errors show the line and column.</p>
<label for="json-in">Your JSON</label>
<textarea id="json-in" spellcheck="false" wrap="off" placeholder='{"hello": "world"}' style="min-height:220px;font-family:'IBM Plex Mono',monospace;font-size:.92rem;white-space:pre;overflow:auto"></textarea>
<p class="hint" id="json-status" aria-live="polite" style="margin:8px 0 0"></p>
<label for="json-indent">Indent with</label><select id="json-indent"><option value="2" selected>2 spaces</option><option value="4">4 spaces</option><option value="tab">Tab</option></select>
<div class="opts"><label><input type="checkbox" id="json-sort"> Sort keys A to Z</label></div>
<div class="row"><button class="btn" id="json-format">Format</button><button class="btn" id="json-min">Minify</button><button class="btn alt" id="json-jump" disabled>Jump to error</button></div>
<div class="result pre" id="json-out" style="font-size:.9rem">Your result shows up here.</div>
<div class="row"><button class="btn" id="json-copy" disabled>Copy</button><button class="btn alt" id="json-dl" disabled>Download .json</button><button class="btn alt" id="json-sample">Try a sample</button><button class="btn alt" id="json-clear">Clear</button></div>
<p class="hint" style="margin-top:12px">Tip: Ctrl or Cmd + Enter formats. Browsers keep numbers beyond about 15 digits approximate and list whole-number keys first, so formatted output can differ in those two cases.</p>
  `,
  init() {
    const inp = $("json-in"), out = $("json-out"), status = $("json-status"), jump = $("json-jump");
    const PLACEHOLDER = "Your result shows up here.";
    let result = "", errPos = -1, timer = 0, outIsError = false;
    const bytesOf = (t) => new TextEncoder().encode(t).length;
    const size = (n) => n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : n >= 1024 ? (n / 1024).toFixed(1) + " KB" : n + " bytes";

    /* A small strict JSON scanner. JSON.parse messages differ between browsers, so this finds the exact spot itself. */
    function findError(s) {
      let i = 0;
      const fail = (msg) => { throw { pos: i, msg }; };
      const end = () => i >= s.length;
      const ws = () => { while (i < s.length && " \t\n\r".includes(s[i])) i++; };
      function str() {
        i++;
        for (;;) {
          if (end()) fail("The string is never closed");
          const c = s[i];
          if (c === '"') { i++; return; }
          if (c < " ") fail("A raw line break or control character is not allowed inside a string (write \\n instead)");
          if (c === "\\") {
            i++;
            const e = s[i];
            if (e === "u") { if (!/^[0-9a-fA-F]{4}$/.test(s.slice(i + 1, i + 5))) fail("A \\u escape needs 4 hex digits"); i += 5; }
            else if (e !== undefined && '"\\/bfnrt'.includes(e)) i++;
            else fail("Unknown escape sequence");
          } else i++;
        }
      }
      function num() {
        const re = /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/y; re.lastIndex = i;
        const m = re.exec(s);
        if (!m) fail("Not a valid number");
        i += m[0].length;
        if (/[0-9.eE+\-a-zA-Z]/.test(s[i] || "")) fail("Not a valid number");
      }
      function container(close, item) {
        i++; ws();
        if (s[i] === close) { i++; return; }
        for (;;) {
          ws();
          if (end()) fail("The JSON ends too early");
          if (s[i] === close) fail("A trailing comma is not allowed");
          item(); ws();
          if (s[i] === ",") { i++; continue; }
          if (s[i] === close) { i++; return; }
          fail(end() ? "The JSON ends too early" : "Expected “,” or “" + close + "” here (is a comma missing?)");
        }
      }
      function val() {
        ws();
        if (end()) fail("The JSON ends too early");
        const c = s[i];
        if (c === "{") return container("}", () => {
          if (s[i] !== '"') fail("Property names must be in double quotes");
          str(); ws();
          if (s[i] !== ":") fail(end() ? "The JSON ends too early" : "Expected “:” after the property name");
          i++; val();
        });
        if (c === "[") return container("]", val);
        if (c === '"') return str();
        if (c === "-" || (c >= "0" && c <= "9")) return num();
        for (const k of ["true", "false", "null"]) if (s.startsWith(k, i)) { i += k.length; return; }
        fail(c === "'" ? "Strings need double quotes, not single quotes" : "Unexpected character “" + c + "”");
      }
      try { val(); ws(); if (!end()) fail("Unexpected text after the JSON value"); return null; }
      catch (e) {
        if (e && typeof e.pos === "number") return e;
        if (e instanceof RangeError) return { pos: i, msg: "The JSON is nested too deeply" };
        throw e;
      }
    }
    function check(text) {
      try { return { ok: true, value: JSON.parse(text) }; }
      catch (e) {
        const f = findError(text);
        if (f) return { ok: false, pos: f.pos, msg: f.msg };
        const m = /position (\d+)/.exec(e.message);
        return { ok: false, pos: m ? +m[1] : 0, msg: e.message };
      }
    }
    const lineCol = (s, pos) => { const lines = s.slice(0, pos).split("\n"); return { line: lines.length, col: lines[lines.length - 1].length + 1 }; };
    const describe = (v) => Array.isArray(v) ? "array (" + v.length + (v.length === 1 ? " item)" : " items)")
      : v === null ? "null" : typeof v === "object" ? "object (" + Object.keys(v).length + (Object.keys(v).length === 1 ? " key)" : " keys)") : typeof v;
    function sortKeys(v) {
      if (Array.isArray(v)) return v.map(sortKeys);
      if (v && typeof v === "object") { const n = Object.create(null); Object.keys(v).sort().forEach((k) => { n[k] = sortKeys(v[k]); }); return n; }
      return v;
    }

    function setResult(text) { result = text; $("json-copy").disabled = $("json-dl").disabled = !text; }
    function clearOut() { setResult(""); out.textContent = PLACEHOLDER; outIsError = false; errPos = -1; jump.disabled = true; }
    function showError(text, r) {
      const lc = lineCol(text, r.pos);
      status.textContent = "✗ Line " + lc.line + ", column " + lc.col + ": " + r.msg + ".";
      const line = text.split("\n")[lc.line - 1].replace(/\r$/, "").replace(/\t/g, " ");
      const start = Math.max(0, lc.col - 1 - 40), seg = line.slice(start, start + 100);
      const prefix = "Line " + lc.line + " │ ";
      out.textContent = prefix + seg + "\n" + " ".repeat(prefix.length + lc.col - 1 - start) + "▲ here";
      setResult(""); outIsError = true; errPos = r.pos; jump.disabled = false;
    }

    function run(kind) {
      const text = inp.value;
      if (!text.trim()) { clearOut(); status.textContent = "Paste some JSON first."; return false; }
      const r = check(text);
      if (!r.ok) { showError(text, r); return false; }
      const v = $("json-sort").checked ? sortKeys(r.value) : r.value, ind = $("json-indent").value;
      const res = JSON.stringify(v, null, kind === "min" ? 0 : ind === "tab" ? "\t" : +ind);
      out.textContent = res; setResult(res); outIsError = false; errPos = -1; jump.disabled = true;
      status.textContent = "✓ Valid JSON · " + describe(r.value) + " · " + size(bytesOf(text)) + " → " + size(bytesOf(res));
      return true;
    }
    function live() {
      const text = inp.value;
      if (!text.trim()) { clearOut(); status.textContent = ""; return; }
      const r = check(text);
      if (!r.ok) { showError(text, r); return; }
      jump.disabled = true; errPos = -1;
      status.textContent = "✓ Valid JSON · " + describe(r.value) + " · " + size(bytesOf(text));
      if (outIsError) { out.textContent = "Press Format or Minify to see the result."; outIsError = false; }
    }

    inp.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(live, 200); });
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run("fmt"); } });
    $("json-format").onclick = () => run("fmt");
    $("json-min").onclick = () => run("min");
    jump.onclick = () => { if (errPos < 0) return; inp.focus(); inp.setSelectionRange(errPos, Math.min(errPos + 1, inp.value.length)); };
    $("json-copy").onclick = () => { if (result) copyText(result, $("json-copy")); };
    $("json-dl").onclick = () => {
      if (!result) return;
      const u = URL.createObjectURL(new Blob([result], { type: "application/json" }));
      download(u, "data.json"); setTimeout(() => URL.revokeObjectURL(u), 1000);
    };
    $("json-sample").onclick = () => { inp.value = '{"name":"Twatos Tools","tools":["qr","json","units"],"stable":true,"version":2,"links":{"home":"index.html"}}'; run("fmt"); };
    $("json-clear").onclick = () => { inp.value = ""; clearOut(); status.textContent = ""; inp.focus(); };
    $("json-sort").addEventListener("change", () => { if (result) run(result.includes("\n") ? "fmt" : "min"); });
    $("json-indent").addEventListener("change", () => { if (result && result.includes("\n")) run("fmt"); });
    clearOut();
  }
});

// unit converter
(window.TOOLS ||= []).push({
  id: "units", title: "Unit Converter", emoji: "📐",
  desc: "Length, weight, temperature, volume, area, speed, time and data.",
  cat: "convert", kw: "unit convert length weight mass temperature celsius fahrenheit volume area speed time data bytes metric imperial km miles kg pounds",
  html: `
<h2>Unit Converter</h2><p class="hint">Pick a type, enter a number and choose the units. Everything runs on your device.</p>
<label for="units-cat">Type</label><select id="units-cat"></select>
<label for="units-amt">Amount</label><input type="number" id="units-amt" value="1" step="any" inputmode="decimal">
<label for="units-from">From</label><select id="units-from"></select>
<label for="units-to">To</label><select id="units-to"></select>
<div class="row"><button class="btn alt" id="units-swap">Swap ⇄</button><button class="btn" id="units-copy">Copy result</button></div>
<div class="result big" id="units-out" aria-live="polite"></div>
<p class="hint" id="units-note" style="margin-top:10px"></p>
<h3 style="margin-top:18px">Same amount in every unit</h3>
<ul class="list" id="units-all"></ul>
  `,
  init() {
    const lin = (id, name, sym, f) => ({ id, name, sym, to: (v) => v * f, from: (v) => v / f });
    const SETS = {
      length: { label: "Length", def: ["km", "mi"], units: [lin("mm", "Millimeter", "mm", 0.001), lin("cm", "Centimeter", "cm", 0.01), lin("m", "Meter", "m", 1), lin("km", "Kilometer", "km", 1000), lin("in", "Inch", "in", 0.0254), lin("ft", "Foot", "ft", 0.3048), lin("yd", "Yard", "yd", 0.9144), lin("mi", "Mile", "mi", 1609.344), lin("nmi", "Nautical mile", "nmi", 1852)] },
      mass: { label: "Weight / mass", def: ["kg", "lb"], units: [lin("mg", "Milligram", "mg", 1e-6), lin("g", "Gram", "g", 0.001), lin("kg", "Kilogram", "kg", 1), lin("t", "Metric ton", "t", 1000), lin("oz", "Ounce", "oz", 0.028349523125), lin("lb", "Pound", "lb", 0.45359237), lin("st", "Stone", "st", 6.35029318)] },
      temp: { label: "Temperature", def: ["c", "f"], units: [
        { id: "c", name: "Celsius", sym: "°C", to: (v) => v, from: (v) => v },
        { id: "f", name: "Fahrenheit", sym: "°F", to: (v) => (v - 32) * 5 / 9, from: (v) => v * 9 / 5 + 32 },
        { id: "k", name: "Kelvin", sym: "K", to: (v) => v - 273.15, from: (v) => v + 273.15 }] },
      volume: { label: "Volume", def: ["l", "gal"], units: [lin("ml", "Milliliter", "ml", 1), lin("l", "Liter", "L", 1000), lin("m3", "Cubic meter", "m³", 1e6), lin("tsp", "Teaspoon (US)", "tsp", 4.92892159375), lin("tbsp", "Tablespoon (US)", "tbsp", 14.78676478125), lin("floz", "Fluid ounce (US)", "fl oz", 29.5735295625), lin("cup", "Cup (US)", "cup", 236.5882365), lin("pt", "Pint (US)", "pt", 473.176473), lin("qt", "Quart (US)", "qt", 946.352946), lin("gal", "Gallon (US)", "gal", 3785.411784)] },
      area: { label: "Area", def: ["m2", "ft2"], units: [lin("cm2", "Square centimeter", "cm²", 1e-4), lin("m2", "Square meter", "m²", 1), lin("ha", "Hectare", "ha", 1e4), lin("km2", "Square kilometer", "km²", 1e6), lin("in2", "Square inch", "in²", 0.00064516), lin("ft2", "Square foot", "ft²", 0.09290304), lin("yd2", "Square yard", "yd²", 0.83612736), lin("ac", "Acre", "ac", 4046.8564224), lin("mi2", "Square mile", "mi²", 2589988.110336)] },
      speed: { label: "Speed", def: ["kmh", "mph"], units: [lin("ms", "Meter per second", "m/s", 1), lin("kmh", "Kilometer per hour", "km/h", 1 / 3.6), lin("mph", "Mile per hour", "mph", 0.44704), lin("kn", "Knot", "kn", 1852 / 3600), lin("fps", "Foot per second", "ft/s", 0.3048)] },
      time: { label: "Time", def: ["h", "min"], units: [lin("ms", "Millisecond", "ms", 0.001), lin("s", "Second", "s", 1), lin("min", "Minute", "min", 60), lin("h", "Hour", "h", 3600), lin("d", "Day", "d", 86400), lin("wk", "Week", "wk", 604800), lin("yr", "Year (365.25 days)", "yr", 31557600)] },
      data: { label: "Data size", def: ["mb", "gb"], units: [lin("b", "Byte", "B", 1), lin("kb", "Kilobyte (1,000 B)", "KB", 1e3), lin("mb", "Megabyte (1,000 KB)", "MB", 1e6), lin("gb", "Gigabyte (1,000 MB)", "GB", 1e9), lin("tb", "Terabyte (1,000 GB)", "TB", 1e12), lin("kib", "Kibibyte (1,024 B)", "KiB", 1024), lin("mib", "Mebibyte (1,024 KiB)", "MiB", 1048576), lin("gib", "Gibibyte (1,024 MiB)", "GiB", 1073741824)] }
    };
    const cat = $("units-cat"), from = $("units-from"), to = $("units-to"), out = $("units-out");
    const fmt = (n) => {
      if (n === 0) return "0";
      const x = Math.abs(n);
      if (x >= 1e12 || x < 1e-6) return n.toExponential(6).replace(/\.?0+e/, "e");
      return n.toLocaleString(undefined, { maximumSignificantDigits: 10 });
    };
    const unit = (id) => SETS[cat.value].units.find((u) => u.id === id);
    const conv = (a, f, t) => t.from(f.to(a));

    function fill(sel, units, pick) {
      sel.innerHTML = "";
      units.forEach((u) => sel.add(new Option(u.name + " (" + u.sym + ")", u.id)));
      sel.value = pick;
    }
    function setCat() {
      const s = SETS[cat.value];
      fill(from, s.units, s.def[0]); fill(to, s.units, s.def[1]);
      update();
    }
    function update() {
      const list = $("units-all"), note = $("units-note");
      list.innerHTML = ""; note.textContent = "";
      const raw = $("units-amt").value, a = parseFloat(raw);
      if (raw === "" || !isFinite(a)) { out.textContent = "Enter a number."; $("units-copy").disabled = true; return; }
      const f = unit(from.value), t = unit(to.value);
      if (!f || !t) return;
      if (cat.value === "temp" && f.to(a) < -273.15 - 1e-9) { out.textContent = "That is below absolute zero."; $("units-copy").disabled = true; return; }
      $("units-copy").disabled = false;
      out.textContent = fmt(a) + " " + f.sym + " = " + fmt(conv(a, f, t)) + " " + t.sym;
      if (cat.value !== "temp") note.textContent = "1 " + f.sym + " = " + fmt(conv(1, f, t)) + " " + t.sym;
      SETS[cat.value].units.forEach((u) => {
        const li = document.createElement("li"); li.textContent = fmt(conv(a, f, u)) + " " + u.sym + " (" + u.name + ")"; list.append(li);
      });
    }
    Object.keys(SETS).forEach((k) => cat.add(new Option(SETS[k].label, k)));
    cat.addEventListener("change", setCat);
    $("units-amt").addEventListener("input", update);
    from.addEventListener("change", update);
    to.addEventListener("change", update);
    $("units-swap").onclick = () => { const a = from.value; from.value = to.value; to.value = a; update(); };
    $("units-copy").onclick = () => copyText(out.textContent, $("units-copy"));
    setCat();
  }
});

// base64 and url encoder
(window.TOOLS ||= []).push({
  id: "enc", title: "Base64 & URL Encoder", emoji: "🔤",
  desc: "Encode or decode Base64 and URL text. Turn small files into Base64.",
  cat: "convert", kw: "base64 url encode decode percent escape uri component data file binary",
  html: `
<h2>Base64 &amp; URL Encoder</h2><p class="hint">Encode or decode text, or turn a small file into Base64. Everything stays on your device.</p>
<label for="enc-mode">What to do</label>
<select id="enc-mode"><option value="b64e">Base64: encode</option><option value="b64d">Base64: decode</option><option value="urle">URL: encode</option><option value="urld">URL: decode</option></select>
<div id="enc-g-b64e" class="opts"><label><input type="checkbox" id="enc-safe"> URL-safe (- and _ instead of + and /)</label><label><input type="checkbox" id="enc-nopad"> Leave out = padding</label></div>
<div id="enc-g-urle"><label for="enc-scope">Encode</label><select id="enc-scope"><option value="part">A piece of a URL (also encodes : / ? &amp; =)</option><option value="whole">A whole URL (keeps : / ? &amp; =)</option></select></div>
<div id="enc-g-urld" class="opts"><label><input type="checkbox" id="enc-plus"> Treat + as a space</label></div>
<label for="enc-in">Your text</label><textarea id="enc-in" spellcheck="false" style="min-height:130px" placeholder="Type or paste here…"></textarea>
<div id="enc-g-file">
<label for="enc-file">Or choose a small file (up to 2 MB)</label><input type="file" id="enc-file">
<div class="opts"><label><input type="checkbox" id="enc-dataurl"> Add a data: prefix (for use in HTML or CSS)</label></div>
</div>
<p class="hint" id="enc-status" aria-live="polite" style="margin:12px 0 0"></p>
<div class="result pre" id="enc-out" style="font-size:.9rem">Your result shows up here.</div>
<div class="row"><button class="btn" id="enc-copy" disabled>Copy</button><button class="btn alt" id="enc-swap" disabled>Use result as input ⇅</button><button class="btn alt" id="enc-dl" disabled>Download file</button><button class="btn alt" id="enc-clear">Clear</button></div>
  `,
  init() {
    const mode = $("enc-mode"), inp = $("enc-in"), out = $("enc-out"), status = $("enc-status");
    const MAX_FILE = 2 * 1024 * 1024, SHOW = 100000, PLACEHOLDER = "Your result shows up here.";
    const SWAP = { b64e: "b64d", b64d: "b64e", urle: "urld", urld: "urle" };
    let fullOut = "", decoded = null, file = null, runId = 0;

    const toB64 = (bytes) => { let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
    function fromB64(text) {
      let s = text.trim();
      const m = /^data:[^,]*;base64,/i.exec(s);
      if (m) s = s.slice(m[0].length);
      s = s.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s) || s.length % 4 === 1) throw new Error("That is not valid Base64. Look for stray characters or a cut-off end.");
      while (s.length % 4) s += "=";
      const bin = atob(s), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return bytes;
    }
    function show(text, msg) {
      fullOut = text;
      out.textContent = text ? (text.length > SHOW ? text.slice(0, SHOW) + "\n… (showing the first " + SHOW.toLocaleString() + " characters; Copy gets everything)" : text) : PLACEHOLDER;
      status.textContent = msg;
      $("enc-copy").disabled = $("enc-swap").disabled = !text;
      $("enc-dl").disabled = !decoded;
    }
    function fail(msg) { decoded = null; show("", "✗ " + msg); }
    function sync() {
      const m = mode.value;
      $("enc-g-b64e").hidden = m !== "b64e"; $("enc-g-urle").hidden = m !== "urle"; $("enc-g-urld").hidden = m !== "urld"; $("enc-g-file").hidden = m !== "b64e";
      $("enc-dl").textContent = m === "b64d" ? "Download decoded file" : "Download file";
      $("enc-dl").hidden = m !== "b64d";
    }

    async function run() {
      const me = ++runId, m = mode.value;
      decoded = null;
      try {
        if (m === "b64e") {
          let bytes, prefix = "";
          if (file) { bytes = new Uint8Array(await file.arrayBuffer()); if (me !== runId) return; if ($("enc-dataurl").checked) prefix = "data:" + (file.type || "application/octet-stream") + ";base64,"; }
          else { if (!inp.value) { show("", ""); return; } bytes = new TextEncoder().encode(inp.value); }
          let s = toB64(bytes);
          if ($("enc-safe").checked) s = s.replace(/\+/g, "-").replace(/\//g, "_");
          if ($("enc-nopad").checked) s = s.replace(/=+$/, "");
          show(prefix + s, "✓ Encoded " + bytes.length.toLocaleString() + " bytes into " + (prefix + s).length.toLocaleString() + " characters" + (file ? " (" + file.name + ")." : "."));
        } else if (m === "b64d") {
          if (!inp.value.trim()) { show("", ""); return; }
          const bytes = fromB64(inp.value);
          decoded = bytes;
          let text = null;
          try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch (e) { text = null; }
          if (text === null) { out.textContent = "This is binary data (" + bytes.length.toLocaleString() + " bytes), not text. Use “Download decoded file” to save it."; fullOut = ""; status.textContent = "✓ Decoded " + bytes.length.toLocaleString() + " bytes of binary data."; $("enc-copy").disabled = $("enc-swap").disabled = true; $("enc-dl").disabled = false; }
          else show(text, "✓ Decoded " + bytes.length.toLocaleString() + " bytes of text.");
        } else if (m === "urle") {
          if (!inp.value) { show("", ""); return; }
          const s = $("enc-scope").value === "whole" ? encodeURI(inp.value) : encodeURIComponent(inp.value);
          show(s, "✓ Encoded. " + s.length.toLocaleString() + " characters.");
        } else {
          if (!inp.value) { show("", ""); return; }
          let s = inp.value; if ($("enc-plus").checked) s = s.replace(/\+/g, " ");
          const r = decodeURIComponent(s);
          show(r, "✓ Decoded. " + r.length.toLocaleString() + " characters.");
        }
      } catch (e) {
        if (m === "urld") fail("That is not valid percent-encoding. A % must be followed by two hex digits (like %20).");
        else if (m === "urle") fail("The text contains a character that cannot be encoded (a broken emoji or symbol).");
        else fail(e.message || "Something went wrong.");
      }
    }

    function clearFile() { file = null; $("enc-file").value = ""; inp.disabled = false; inp.placeholder = "Type or paste here…"; }
    $("enc-file").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) { clearFile(); run(); return; }
      if (f.size > MAX_FILE) { clearFile(); fail(f.name + " is " + (f.size / 1048576).toFixed(1) + " MB. The limit is 2 MB."); return; }
      file = f; inp.value = ""; inp.disabled = true; inp.placeholder = "Using the file " + f.name + ". Clear to go back to typing.";
      run();
    });
    inp.addEventListener("input", run);
    mode.addEventListener("change", () => { sync(); if (mode.value !== "b64e") clearFile(); run(); });
    ["enc-safe", "enc-nopad", "enc-dataurl", "enc-scope", "enc-plus"].forEach((id) => $(id).addEventListener("change", run));
    $("enc-copy").onclick = () => { if (fullOut) copyText(fullOut, $("enc-copy")); };
    $("enc-swap").onclick = () => { if (!fullOut) return; const t = fullOut; clearFile(); mode.value = SWAP[mode.value]; inp.value = t; sync(); run(); };
    $("enc-dl").onclick = () => {
      if (!decoded) return;
      let isText = true; try { new TextDecoder("utf-8", { fatal: true }).decode(decoded); } catch (e) { isText = false; }
      const u = URL.createObjectURL(new Blob([decoded]));
      download(u, isText ? "decoded.txt" : "decoded.bin"); setTimeout(() => URL.revokeObjectURL(u), 1000);
    };
    $("enc-clear").onclick = () => { clearFile(); inp.value = ""; runId++; decoded = null; show("", ""); inp.focus(); };
    sync(); show("", "");
  }
});


// text diff
(window.TOOLS ||= []).push({
  id: "diff", title: "Text Diff", emoji: "🔍",
  desc: "Compare two texts line by line and see what was added or removed.",
  cat: "convert", kw: "diff compare difference text lines changes added removed merge code version",
  html: `
<style>
.diff-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
.diff-grid textarea{font-family:'IBM Plex Mono',monospace;font-size:.88rem;white-space:pre;overflow:auto;min-height:170px}
.diff-wrap{overflow-x:auto;margin-top:12px}
.diff-table{width:100%;border-collapse:collapse;font-family:'IBM Plex Mono',monospace;font-size:.85rem}
.diff-table td{padding:1px 8px;vertical-align:top;white-space:pre-wrap;word-break:break-word}
.diff-table td.n{width:1%;text-align:right;color:var(--ink-soft);white-space:nowrap;user-select:none}
.diff-table td.s{width:1%;font-weight:700;user-select:none}
.diff-table tr.add{background:rgba(63,125,92,.25)}
.diff-table tr.del{background:rgba(190,60,45,.22)}
.diff-table tr.add td.s{color:#245a3b}
.diff-table tr.del td.s{color:#8e2a1c}
.diff-table tr.add mark{background:rgba(63,125,92,.5);color:inherit;border-radius:2px}
.diff-table tr.del mark{background:rgba(190,60,45,.45);color:inherit;border-radius:2px}
.diff-table tr.gap td{color:var(--ink-soft);text-align:center;font-style:italic;padding:4px}
</style>
<h2>Text Diff</h2><p class="hint">Paste an original and a changed version. Added lines are green with +, removed lines are red with −.</p>
<div class="diff-grid">
<div><label for="diff-a">Original</label><textarea id="diff-a" spellcheck="false" wrap="off"></textarea></div>
<div><label for="diff-b">Changed</label><textarea id="diff-b" spellcheck="false" wrap="off"></textarea></div>
</div>
<div class="opts"><label><input type="checkbox" id="diff-space"> Ignore extra spaces</label><label><input type="checkbox" id="diff-case"> Ignore capital letters</label><label><input type="checkbox" id="diff-fold"> Hide unchanged lines</label></div>
<div class="row"><button class="btn alt" id="diff-swap">Swap ⇄</button><button class="btn alt" id="diff-sample">Try a sample</button><button class="btn alt" id="diff-clear">Clear</button></div>
<p class="big" id="diff-sum" aria-live="polite" style="margin-top:16px">Paste text in both boxes to compare.</p>
<div class="result diff-wrap" id="diff-out" tabindex="0" role="region" aria-label="Differences" style="padding:8px 0" hidden></div>
<div class="row"><button class="btn" id="diff-copy" disabled>Copy as +/- text</button></div>
  `,
  init() {
    const MAXCELLS = 6e6, MAXROWS = 5000;
    const toLines = (t) => { if (!t) return []; const a = t.split(/\r\n|\r|\n/); if (a.length > 1 && a[a.length - 1] === "") a.pop(); return a; };
    let plain = "", timer = 0;

    /* Longest-common-subsequence diff. Returns [["=",i,j], ["-",i], ["+",j]...] or null when the input is too big. */
    function diffOps(a, b) {
      let s = 0;
      while (s < a.length && s < b.length && a[s] === b[s]) s++;
      let ea = a.length, eb = b.length;
      while (ea > s && eb > s && a[ea - 1] === b[eb - 1]) { ea--; eb--; }
      const n = ea - s, m = eb - s;
      if ((n + 1) * (m + 1) > MAXCELLS) return null;
      const w = m + 1, dp = new Uint32Array((n + 1) * w);
      for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
        dp[i * w + j] = a[s + i] === b[s + j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
      const ops = [];
      for (let i = 0; i < s; i++) ops.push(["=", i, i]);
      let i = 0, j = 0;
      while (i < n && j < m) {
        if (a[s + i] === b[s + j]) { ops.push(["=", s + i, s + j]); i++; j++; }
        else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) { ops.push(["-", s + i]); i++; }
        else { ops.push(["+", s + j]); j++; }
      }
      while (i < n) ops.push(["-", s + i++]);
      while (j < m) ops.push(["+", s + j++]);
      for (let k = 0; k < a.length - ea; k++) ops.push(["=", ea + k, eb + k]);
      return ops;
    }
    const keyOf = (l) => { let k = l; if ($("diff-space").checked) k = k.trim().replace(/\s+/g, " "); if ($("diff-case").checked) k = k.toLowerCase(); return k; };
    const tokens = (s) => s.match(/[\p{L}\p{N}_]+|\s+|[^\s\p{L}\p{N}_]/gu) || [];

    /* Mark the words that changed between a removed line and the added line that replaced it */
    function inline(oldLine, newLine) {
      const ta = tokens(oldLine), tb = tokens(newLine);
      if (ta.length > 400 || tb.length > 400) return null;
      const ops = diffOps(ta.map(keyOf), tb.map(keyOf));
      if (!ops) return null;
      const mark = (list, sign) => { const out = []; const hit = new Set(ops.filter((o) => o[0] === sign).map((o) => o[1])); list.forEach((t, i) => out.push({ t, m: hit.has(i) })); return out; };
      return { del: mark(ta, "-"), add: mark(tb, "+") };
    }
    function cell(cls, text) { const td = document.createElement("td"); td.className = cls; td.textContent = text; return td; }
    function textCell(frags, fallback) {
      const td = document.createElement("td");
      if (!frags) { td.textContent = fallback; return td; }
      frags.forEach((f) => { if (f.m && f.t.trim()) { const mk2 = document.createElement("mark"); mk2.textContent = f.t; td.append(mk2); } else td.append(document.createTextNode(f.t)); });
      return td;
    }

    function render() {
      const A = toLines($("diff-a").value), B = toLines($("diff-b").value);
      const out = $("diff-out"), sum = $("diff-sum");
      out.textContent = ""; plain = ""; $("diff-copy").disabled = true;
      if (!A.length && !B.length) { out.hidden = true; sum.textContent = "Paste text in both boxes to compare."; return; }
      const ops = diffOps(A.map(keyOf), B.map(keyOf));
      if (!ops) { out.hidden = true; sum.textContent = "These texts are too different or too long to compare here. Try comparing smaller parts."; return; }
      let add = 0, del = 0, same = 0;
      ops.forEach((o) => { if (o[0] === "+") add++; else if (o[0] === "-") del++; else same++; });
      if (!add && !del) { out.hidden = true; sum.textContent = "✓ The two texts match" + (same ? " (" + same + (same === 1 ? " line)." : " lines).") : "."); return; }

      /* turn the operations into display rows; pair removed and added lines so changed words can be marked */
      const rows = [], plainLines = [];
      for (let k = 0; k < ops.length;) {
        if (ops[k][0] === "=") { const [, i, j] = ops[k]; rows.push({ kind: "eq", o: i + 1, n: j + 1, text: B[j] }); plainLines.push("  " + B[j]); k++; continue; }
        const dels = [], adds = [];
        while (k < ops.length && ops[k][0] !== "=") { if (ops[k][0] === "-") dels.push(ops[k][1]); else adds.push(ops[k][1]); k++; }
        const pairs = Math.min(dels.length, adds.length), marks = [];
        for (let p = 0; p < pairs; p++) marks.push(inline(A[dels[p]], B[adds[p]]));
        dels.forEach((i, p) => { rows.push({ kind: "del", o: i + 1, n: "", text: A[i], frags: marks[p] ? marks[p].del : null }); plainLines.push("- " + A[i]); });
        adds.forEach((j, p) => { rows.push({ kind: "add", o: "", n: j + 1, text: B[j], frags: marks[p] ? marks[p].add : null }); plainLines.push("+ " + B[j]); });
      }
      plain = plainLines.join("\n");

      const CTX = 2, fold = $("diff-fold").checked, show = rows.map(() => !fold);
      if (fold) rows.forEach((r, i) => { if (r.kind !== "eq") for (let d = -CTX; d <= CTX; d++) if (rows[i + d]) show[i + d] = true; });
      const table = document.createElement("table"); table.className = "diff-table"; table.setAttribute("aria-label", "Line by line differences");
      const body = document.createElement("tbody");
      let shown = 0, hidden = 0;
      const flushGap = () => { if (!hidden) return; const tr = document.createElement("tr"); tr.className = "gap"; const td = document.createElement("td"); td.colSpan = 4; td.textContent = "… " + hidden + " unchanged " + (hidden === 1 ? "line" : "lines") + " …"; tr.append(td); body.append(tr); hidden = 0; };
      for (let i = 0; i < rows.length; i++) {
        if (!show[i]) { hidden++; continue; }
        flushGap();
        if (shown >= MAXROWS) break;
        const r = rows[i], tr = document.createElement("tr"); tr.className = r.kind === "eq" ? "" : r.kind;
        tr.append(cell("n", r.o), cell("n", r.n), cell("s", r.kind === "add" ? "+" : r.kind === "del" ? "−" : " "), textCell(r.frags, r.text));
        if (r.kind !== "eq") tr.setAttribute("aria-label", (r.kind === "add" ? "Added: " : "Removed: ") + r.text);
        body.append(tr); shown++;
      }
      flushGap();
      table.append(body); out.append(table); out.hidden = false;
      if (shown >= MAXROWS) { const p = document.createElement("p"); p.className = "hint"; p.style.padding = "8px"; p.textContent = "Showing the first " + MAXROWS + " rows. Copy gets everything."; out.append(p); }
      sum.textContent = "+" + add + " added · −" + del + " removed · " + same + " unchanged";
      $("diff-copy").disabled = false;
    }
    const schedule = () => { clearTimeout(timer); timer = setTimeout(render, 200); };
    ["diff-a", "diff-b"].forEach((id) => $(id).addEventListener("input", schedule));
    ["diff-space", "diff-case", "diff-fold"].forEach((id) => $(id).addEventListener("change", render));
    $("diff-swap").onclick = () => { const t = $("diff-a").value; $("diff-a").value = $("diff-b").value; $("diff-b").value = t; render(); };
    $("diff-clear").onclick = () => { $("diff-a").value = ""; $("diff-b").value = ""; render(); $("diff-a").focus(); };
    $("diff-sample").onclick = () => {
      $("diff-a").value = "Shopping list\nmilk\neggs\nbread\nbutter\ncoffee beans";
      $("diff-b").value = "Shopping list\nmilk (oat)\neggs\nbread\ncoffee beans\ntea bags";
      render();
    };
    $("diff-copy").onclick = () => { if (plain) copyText(plain, $("diff-copy")); };
    render();
  }
});

// image cropper
(window.TOOLS ||= []).push({
  id: "crop", title: "Image Cropper", emoji: "✂️",
  desc: "Crop a photo to any shape, then download it. Nothing is uploaded.",
  cat: "convert", kw: "crop image photo picture resize ratio square 16:9 trim cut png jpg webp avatar",
  html: `
<style>
#crop-canvas{display:block;max-width:100%;touch-action:pan-y pinch-zoom;border:2px solid var(--ink);border-radius:6px;background:var(--receipt)}
#crop-canvas:focus-visible{outline:3px solid var(--convert);outline-offset:2px}
.crop-nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px}
</style>
<h2>Image Cropper</h2><p class="hint">Choose an image and a shape, then drag the box or its handles. With a keyboard, focus the picture, then use the arrow keys to move the box and + or − to resize it. Nothing leaves your device.</p>
<label for="crop-file">Image file</label><input type="file" id="crop-file" accept="image/*">
<label for="crop-ratio">Shape</label>
<select id="crop-ratio"><option value="free">Free</option><option value="orig">Same as the image</option><option value="1:1">Square 1:1</option><option value="4:3">4:3</option><option value="3:4">3:4</option><option value="3:2">3:2</option><option value="2:3">2:3</option><option value="16:9">Wide 16:9</option><option value="9:16">Tall 9:16</option><option value="4:5">Portrait 4:5</option></select>
<div id="crop-stage" hidden style="margin-top:16px">
<canvas id="crop-canvas" tabindex="0" role="img" aria-label="Image with a crop box. Use arrow keys to move it, plus and minus to resize."></canvas>
<div class="crop-nums" style="margin-top:12px">
<div><label for="crop-x">Left (px)</label><input type="number" id="crop-x" min="0" step="1"></div>
<div><label for="crop-y">Top (px)</label><input type="number" id="crop-y" min="0" step="1"></div>
<div><label for="crop-w">Width (px)</label><input type="number" id="crop-w" min="1" step="1"></div>
<div><label for="crop-h">Height (px)</label><input type="number" id="crop-h" min="1" step="1"></div>
</div>
<label for="crop-fmt">Save as</label><select id="crop-fmt"><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select>
<div id="crop-q-wrap" hidden><label for="crop-q">Quality: <span id="crop-q-val">92%</span></label><input type="range" id="crop-q" min="40" max="100" value="92"></div>
<label for="crop-outw">Resize to width (px, optional)</label><input type="number" id="crop-outw" min="1" max="8192" step="1" placeholder="Keep the cropped size">
<div class="row"><button class="btn" id="crop-dl" disabled>Download cropped image</button><button class="btn alt" id="crop-reset">Reset crop</button></div>
</div>
<p class="hint" id="crop-info" aria-live="polite" style="margin-top:14px">Choose an image to begin.</p>
  `,
  init() {
    const cv = $("crop-canvas"), c2 = cv.getContext("2d"), stage = $("crop-stage"), info = $("crop-info");
    const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
    const MAX_FILE = 60 * 1048576, MAX_OUT_PIXELS = 16e6;
    const clamp = (v, lo, hi) => Math.min(Math.max(v, Math.min(lo, hi)), hi);
    let img = null, imgUrl = null, base = "image", W = 0, H = 0, r = { x: 0, y: 0, w: 0, h: 0 }, R = null;
    let scale = 1, dispW = 0, dpr = 1, drag = null, raf = 0;
    const CURSOR = { nw: "nwse-resize", se: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize", n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize", move: "move" };
    const minSize = () => Math.min(16, W, H);

    function getR() {
      const v = $("crop-ratio").value;
      if (v === "free") return null;
      if (v === "orig") return W / H;
      const [a, b] = v.split(":").map(Number); return a / b;
    }
    /* Keep the box centered but give it the new shape, as large as fits inside the image */
    function refit() {
      R = getR();
      if (!R) return;
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      let w = r.w, h = w / R;
      if (h > H) { h = H; w = h * R; }
      if (w > W) { w = W; h = w / R; }
      r = { x: clamp(cx - w / 2, 0, W - w), y: clamp(cy - h / 2, 0, H - h), w, h };
    }
    function resetBox() { r = { x: 0, y: 0, w: W, h: H }; refit(); }

    /* ----- drawing ----- */
    function layout() {
      if (!img || $("panel-crop").hidden) return;
      dispW = Math.max(160, Math.min(stage.clientWidth || 600, 900));
      scale = dispW / W; dpr = Math.min(window.devicePixelRatio || 1, 3);
      const dispH = Math.max(1, Math.round(H * scale));
      cv.width = Math.round(dispW * dpr); cv.height = Math.round(dispH * dpr);
      cv.style.width = dispW + "px"; cv.style.height = dispH + "px";
      draw();
    }
    const handlePts = () => {
      const x = r.x * scale, y = r.y * scale, w = r.w * scale, h = r.h * scale;
      return { nw: [x, y], n: [x + w / 2, y], ne: [x + w, y], e: [x + w, y + h / 2], se: [x + w, y + h], s: [x + w / 2, y + h], sw: [x, y + h], w: [x, y + h / 2] };
    };
    function draw() {
      raf = 0;
      if (!img) return;
      const dw = W * scale, dh = H * scale;
      c2.setTransform(dpr, 0, 0, dpr, 0, 0); c2.clearRect(0, 0, dw, dh);
      c2.drawImage(img, 0, 0, dw, dh);
      const x = r.x * scale, y = r.y * scale, w = r.w * scale, h = r.h * scale;
      c2.fillStyle = "rgba(20,18,10,.55)"; c2.beginPath(); c2.rect(0, 0, dw, dh); c2.rect(x, y, w, h); c2.fill("evenodd");
      c2.strokeStyle = "#fff"; c2.lineWidth = 2; c2.strokeRect(x, y, w, h);
      c2.strokeStyle = "rgba(255,255,255,.45)"; c2.lineWidth = 1; c2.beginPath();
      for (let i = 1; i < 3; i++) { c2.moveTo(x + w * i / 3, y); c2.lineTo(x + w * i / 3, y + h); c2.moveTo(x, y + h * i / 3); c2.lineTo(x + w, y + h * i / 3); }
      c2.stroke();
      const pts = handlePts();
      Object.keys(pts).forEach((k) => { const [px, py] = pts[k]; c2.fillStyle = "#fbf6e8"; c2.strokeStyle = "#23271f"; c2.lineWidth = 2; c2.fillRect(px - 7, py - 7, 14, 14); c2.strokeRect(px - 7, py - 7, 14, 14); });
    }
    const redraw = () => { if (!raf) raf = requestAnimationFrame(draw); };

    /* ----- numbers, labels and the download button ----- */
    function sync() {
      const ints = { x: Math.round(r.x), y: Math.round(r.y), w: Math.max(1, Math.round(r.w)), h: Math.max(1, Math.round(r.h)) };
      $("crop-x").value = ints.x; $("crop-y").value = ints.y; $("crop-w").value = ints.w; $("crop-h").value = ints.h;
      $("crop-x").max = Math.max(0, W - ints.w); $("crop-y").max = Math.max(0, H - ints.h); $("crop-w").max = W; $("crop-h").max = H;
      const want = parseInt($("crop-outw").value, 10);
      const ow = want >= 1 ? Math.min(want, 8192) : ints.w, oh = want >= 1 ? Math.max(1, Math.round(ow * ints.h / ints.w)) : ints.h;
      info.textContent = "Crop: " + ints.w + " × " + ints.h + " px of " + W + " × " + H + ". Saves as " + ow + " × " + oh + " px " + EXT[$("crop-fmt").value].toUpperCase() + "." + (ow * oh > MAX_OUT_PIXELS ? " That is too large for this browser to save; lower the resize width." : "");
      $("crop-dl").disabled = !img || ow * oh > MAX_OUT_PIXELS;
      cv.setAttribute("aria-label", "Image with a crop box " + ints.w + " by " + ints.h + " pixels, starting " + ints.x + " across and " + ints.y + " down. Use arrow keys to move it, plus and minus to resize.");
    }

    /* ----- dragging a handle ----- */
    function apply(h, dx, dy, s) {
      const min = minSize();
      if (h === "move") { r = { x: clamp(s.x + dx, 0, W - s.w), y: clamp(s.y + dy, 0, H - s.h), w: s.w, h: s.h }; return; }
      const hasW = h.includes("w"), hasE = h.includes("e"), hasN = h.includes("n"), hasS = h.includes("s");
      const L0 = s.x, T0 = s.y, R0 = s.x + s.w, B0 = s.y + s.h;
      if (!R) {
        let L = L0, T = T0, Rr = R0, B = B0;
        if (hasW) L = clamp(s.x + dx, 0, R0 - min);
        if (hasE) Rr = clamp(R0 + dx, L0 + min, W);
        if (hasN) T = clamp(s.y + dy, 0, B0 - min);
        if (hasS) B = clamp(B0 + dy, T0 + min, H);
        r = { x: L, y: T, w: Rr - L, h: B - T }; return;
      }
      if (h.length === 2) {                                   // corner: the opposite corner stays put
        const ax = hasW ? R0 : L0, ay = hasN ? B0 : T0;
        let w = hasW ? ax - clamp(s.x + dx, 0, ax) : clamp(R0 + dx, ax, W) - ax;
        const hh0 = hasN ? ay - clamp(s.y + dy, 0, ay) : clamp(B0 + dy, ay, H) - ay;
        w = Math.max(w, hh0 * R);
        const maxW = Math.min(hasW ? ax : W - ax, (hasN ? ay : H - ay) * R);
        w = clamp(w, Math.min(min * Math.max(1, R), maxW), maxW);
        const hh = w / R;
        r = { x: hasW ? ax - w : ax, y: hasN ? ay - hh : ay, w, h: hh };
      } else if (h === "e" || h === "w") {                    // side: width drives, height follows around the middle
        const ax = h === "w" ? R0 : L0, cy = s.y + s.h / 2;
        let w = h === "w" ? ax - clamp(s.x + dx, 0, ax) : clamp(R0 + dx, ax, W) - ax;
        const maxW = Math.min(h === "w" ? ax : W - ax, 2 * Math.min(cy, H - cy) * R);
        w = clamp(w, Math.min(min * Math.max(1, R), maxW), maxW);
        const hh = w / R;
        r = { x: h === "w" ? ax - w : ax, y: cy - hh / 2, w, h: hh };
      } else {                                                // top or bottom: height drives
        const ay = h === "n" ? B0 : T0, cx = s.x + s.w / 2;
        let hh = h === "n" ? ay - clamp(s.y + dy, 0, ay) : clamp(B0 + dy, ay, H) - ay;
        const maxH = Math.min(h === "n" ? ay : H - ay, 2 * Math.min(cx, W - cx) / R);
        hh = clamp(hh, Math.min(min * Math.max(1, 1 / R), maxH), maxH);
        const w = hh * R;
        r = { x: cx - w / 2, y: h === "n" ? ay - hh : ay, w, h: hh };
      }
    }
    function point(e) { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) * (dispW / b.width), y: (e.clientY - b.top) * (dispW / b.width) }; }
    function hit(px, py, touch) {
      const tol = touch ? 24 : 12, pts = handlePts();
      let best = null, bd = 1e9;
      Object.keys(pts).forEach((k) => { const d = Math.hypot(px - pts[k][0], py - pts[k][1]); if (d <= tol && d < bd) { best = k; bd = d; } });
      if (best) return best;
      const x = r.x * scale, y = r.y * scale, w = r.w * scale, h = r.h * scale, inY = py >= y - tol && py <= y + h + tol, inX = px >= x - tol && px <= x + w + tol;
      const edges = [["w", Math.abs(px - x), inY], ["e", Math.abs(px - x - w), inY], ["n", Math.abs(py - y), inX], ["s", Math.abs(py - y - h), inX]].filter((e) => e[2] && e[1] <= tol).sort((a, b) => a[1] - b[1]);
      if (edges.length && w > tol * 3 && h > tol * 3) return edges[0][0];
      return px >= x && px <= x + w && py >= y && py <= y + h ? "move" : null;
    }
    cv.addEventListener("pointerdown", (e) => {
      if (!img) return;
      const p = point(e), h = hit(p.x, p.y, e.pointerType === "touch");
      if (!h) return;
      e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      drag = { h, sx: p.x, sy: p.y, s: { ...r } };
    });
    cv.addEventListener("pointermove", (e) => {
      if (!img) return;
      const p = point(e);
      if (drag) { apply(drag.h, (p.x - drag.sx) / scale, (p.y - drag.sy) / scale, drag.s); sync(); redraw(); return; }
      if (e.pointerType === "mouse") cv.style.cursor = CURSOR[hit(p.x, p.y, false)] || "default";
    });
    /* A finger on the box or a handle drags it; a finger anywhere else still scrolls the page */
    cv.addEventListener("touchstart", (e) => {
      if (!img || e.touches.length !== 1) return;
      const p = point(e.touches[0]);
      if (hit(p.x, p.y, true)) e.preventDefault();
    }, { passive: false });
    const endDrag = () => { drag = null; };
    cv.addEventListener("pointerup", endDrag); cv.addEventListener("pointercancel", endDrag);

    /* ----- keyboard ----- */
    function zoomBox(f) {
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2, min = minSize();
      let w = r.w * f, h = r.h * f;
      const k = Math.min(1, W / w, H / h); w *= k; h *= k;
      if (w < min || h < min) { const up = Math.max(min / w, min / h); w *= up; h *= up; }
      r = { x: clamp(cx - w / 2, 0, W - w), y: clamp(cy - h / 2, 0, H - h), w, h };
    }
    cv.addEventListener("keydown", (e) => {
      if (!img) return;
      const step = Math.max(1, Math.round(W / 200)) * (e.shiftKey ? 10 : 1);
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (moves[e.key]) { r = { ...r, x: clamp(r.x + moves[e.key][0], 0, W - r.w), y: clamp(r.y + moves[e.key][1], 0, H - r.h) }; }
      else if (e.key === "+" || e.key === "=") zoomBox(1.05);
      else if (e.key === "-" || e.key === "_") zoomBox(0.95);
      else return;
      e.preventDefault(); sync(); redraw();
    });

    /* ----- number boxes ----- */
    function fromInputs(which) {
      const num = (id, def) => { const v = parseInt($(id).value, 10); return isFinite(v) ? v : def; };
      let w = num("crop-w", r.w), h = num("crop-h", r.h);
      if (R) { if (which === "h") w = h * R; else h = w / R; }
      w = clamp(w, minSize(), W); h = clamp(h, minSize(), H);
      if (R) { if (h > w / R + 1e-6) h = w / R; if (w > h * R + 1e-6) w = h * R; }
      r = { x: clamp(num("crop-x", r.x), 0, W - w), y: clamp(num("crop-y", r.y), 0, H - h), w, h };
      sync(); redraw();
    }
    ["crop-x", "crop-y", "crop-w", "crop-h"].forEach((id) => $(id).addEventListener("change", () => fromInputs(id === "crop-h" ? "h" : "w")));

    /* ----- loading and saving ----- */
    $("crop-file").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > MAX_FILE) { info.textContent = f.name + " is bigger than 60 MB. Pick a smaller image."; return; }
      const url = URL.createObjectURL(f), im = new Image();
      im.onload = () => {
        if (imgUrl) URL.revokeObjectURL(imgUrl);
        imgUrl = url; img = im; W = im.naturalWidth; H = im.naturalHeight;
        base = f.name.replace(/\.[^.]+$/, "") || "image";
        stage.hidden = false; resetBox(); layout(); sync();
        cv.focus({ preventScroll: true });
      };
      im.onerror = () => { URL.revokeObjectURL(url); info.textContent = "That file could not be read as an image."; };
      im.src = url;
    });
    $("crop-ratio").addEventListener("change", () => { if (!img) return; refit(); sync(); redraw(); });
    $("crop-reset").onclick = () => { if (!img) return; resetBox(); sync(); redraw(); };
    $("crop-fmt").addEventListener("change", () => { $("crop-q-wrap").hidden = $("crop-fmt").value === "image/png"; sync(); });
    $("crop-q").addEventListener("input", () => { $("crop-q-val").textContent = $("crop-q").value + "%"; });
    $("crop-outw").addEventListener("input", sync);
    $("crop-dl").onclick = () => {
      if (!img) return;
      const sx = clamp(Math.round(r.x), 0, W - 1), sy = clamp(Math.round(r.y), 0, H - 1);
      const sw = clamp(Math.round(r.w), 1, W - sx), sh = clamp(Math.round(r.h), 1, H - sy);
      const want = parseInt($("crop-outw").value, 10), ow = want >= 1 ? Math.min(want, 8192) : sw, oh = want >= 1 ? Math.max(1, Math.round(ow * sh / sw)) : sh;
      if (ow * oh > MAX_OUT_PIXELS) { info.textContent = "That output is too large for this browser. Lower the resize width."; return; }
      const out = document.createElement("canvas"); out.width = ow; out.height = oh;
      const x = out.getContext("2d"), type = $("crop-fmt").value;
      if (type === "image/jpeg") { x.fillStyle = "#fff"; x.fillRect(0, 0, ow, oh); }
      x.imageSmoothingQuality = "high"; x.drawImage(img, sx, sy, sw, sh, 0, 0, ow, oh);
      out.toBlob((b) => {
        if (!b) { info.textContent = "This browser could not save that format. Try PNG or JPG."; return; }
        const ext = EXT[b.type] || "png", u = URL.createObjectURL(b);
        download(u, base + "-cropped." + ext); setTimeout(() => URL.revokeObjectURL(u), 1000);
        info.textContent = "Saved " + ow + " × " + oh + " px " + ext.toUpperCase() + (b.type !== type ? " (this browser could not make " + EXT[type].toUpperCase() + ", so it used " + ext.toUpperCase() + ")" : "") + ".";
      }, type, $("crop-q").value / 100);
    };
    window.addEventListener("resize", layout);
    window.addEventListener("hashchange", () => { if (location.hash === "#crop") layout(); });
    $("crop-q-wrap").hidden = true;
  }
});
