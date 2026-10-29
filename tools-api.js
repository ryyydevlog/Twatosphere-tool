// live tools: call free public APIs (no key needed). what you type gets sent to that service.
// weather -> open-meteo, currency -> frankfurter, words -> dictionaryapi.dev, countries -> restcountries, dogs -> dog.ceo

/* Fetch JSON; throws an Error with .status set when the server says no (404 etc.) */
async function apiGet(url) {
  const r = await fetch(url);
  if (!r.ok) { const e = new Error("HTTP " + r.status); e.status = r.status; throw e; }
  return r.json();
}
/* Tiny element builder: mk("p", "hint", "text"). Uses textContent, so API text can never inject HTML. */
function mk(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
const NET_ERR = "Could not reach the service. Check your connection and try again.";

// weather peek
(window.TOOLS ||= []).push({
  id: "weather", title: "Weather Peek", emoji: "⛅",
  desc: "Current weather and a 5-day forecast for any city.",
  cat: "api", kw: "forecast temperature rain city live api open-meteo",
  html: `
<h2>Weather Peek</h2><p class="hint">Type a city and press Enter. Data from Open-Meteo.</p>
<label for="weather-city">City</label><input type="text" id="weather-city" placeholder="Kuala Lumpur" autocomplete="off">
<label for="weather-unit">Units</label><select id="weather-unit"><option value="c">°C, km/h</option><option value="f">°F, mph</option></select>
<div class="row"><button class="btn" id="weather-go">Check weather</button></div>
<div class="result" id="weather-out" aria-live="polite">Your forecast shows up here.</div>
  `,
  init() {
    /* WMO weather codes -> emoji + words */
    const wx = (c) => c === 0 ? ["☀️", "Clear sky"] : c <= 2 ? ["🌤️", "Partly cloudy"] : c === 3 ? ["☁️", "Overcast"]
      : c <= 48 ? ["🌫️", "Foggy"] : c <= 57 ? ["🌦️", "Drizzle"] : c <= 67 ? ["🌧️", "Rain"] : c <= 77 ? ["❄️", "Snow"]
      : c <= 82 ? ["🌧️", "Rain showers"] : c <= 86 ? ["🌨️", "Snow showers"] : ["⛈️", "Thunderstorm"];
    const out = $("weather-out");
    let latest = 0;                                   // ignore slow answers from older searches
    async function go() {
      const q = $("weather-city").value.trim();
      if (!q) { out.textContent = "Type a city name first."; return; }
      const me = ++latest; out.textContent = "Looking…";
      try {
        const g = await apiGet("https://geocoding-api.open-meteo.com/v1/search?count=1&name=" + encodeURIComponent(q));
        if (me !== latest) return;
        const p = g.results && g.results[0];
        if (!p) { out.textContent = "No place found called “" + q + "”."; return; }
        const f = $("weather-unit").value === "f";
        const w = await apiGet("https://api.open-meteo.com/v1/forecast?latitude=" + p.latitude + "&longitude=" + p.longitude +
          "&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code" +
          "&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto" +
          (f ? "&temperature_unit=fahrenheit&wind_speed_unit=mph" : ""));
        if (me !== latest) return;
        const c = w.current, u = w.current_units, [emoji, words] = wx(c.weather_code);
        out.textContent = "";
        out.append(
          mk("div", "big", emoji + " " + Math.round(c.temperature_2m) + u.temperature_2m + " · " + words),
          mk("p", "hint", [p.name, p.admin1, p.country].filter(Boolean).join(", "))
        );
        const stats = mk("div", "stats");
        [[Math.round(c.apparent_temperature) + u.apparent_temperature, "feels like"], [c.relative_humidity_2m + "%", "humidity"], [Math.round(c.wind_speed_10m) + " " + u.wind_speed_10m, "wind"]]
          .forEach(([v, l]) => { const s = mk("div", "stat"); s.append(mk("b", null, v), l); stats.append(s); });
        const list = mk("ul", "list");
        w.daily.time.forEach((d, i) => {
          const day = new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
          list.append(mk("li", null, day + ": " + wx(w.daily.weather_code[i])[0] + " " + Math.round(w.daily.temperature_2m_min[i]) + "° to " + Math.round(w.daily.temperature_2m_max[i]) + "°"));
        });
        out.append(stats, list);
      } catch (e) { if (me === latest) out.textContent = NET_ERR; }
    }
    $("weather-go").onclick = go;
    $("weather-city").addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    $("weather-unit").addEventListener("change", () => { if ($("weather-city").value.trim()) go(); });
  }
});

// money swapper
(window.TOOLS ||= []).push({
  id: "money", title: "Money Swapper", emoji: "💱",
  desc: "Convert between 30+ currencies with daily bank rates.",
  cat: "api", kw: "currency exchange rate dollar euro ringgit convert live api",
  html: `
<h2>Money Swapper</h2><p class="hint">Daily reference rates from the European Central Bank (via Frankfurter). Good for planning, not for trading.</p>
<label for="money-amt">Amount</label><input type="number" id="money-amt" value="100" min="0" step="any">
<label for="money-from">From</label><select id="money-from"></select>
<label for="money-to">To</label><select id="money-to"></select>
<div class="row"><button class="btn" id="money-go">Convert</button><button class="btn alt" id="money-swap">Swap ⇄</button></div>
<div class="result big" id="money-out" aria-live="polite">Loading currencies…</div>
<p class="hint" id="money-note" style="margin-top:10px"></p>
  `,
  async init() {
    const from = $("money-from"), to = $("money-to"), out = $("money-out");
    let latest = 0;
    async function convert() {
      const a = parseFloat($("money-amt").value);
      $("money-note").textContent = "";
      if (!(a >= 0)) { out.textContent = "Enter an amount (0 or more)."; return; }
      const fmt = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
      if (from.value === to.value) { out.textContent = fmt(a) + " " + from.value + " = " + fmt(a) + " " + to.value; return; }
      const me = ++latest; out.textContent = "Converting…";
      try {
        const d = await apiGet("https://api.frankfurter.dev/v1/latest?amount=" + a + "&base=" + from.value + "&symbols=" + to.value);
        if (me !== latest) return;
        out.textContent = fmt(a) + " " + from.value + " = " + fmt(d.rates[to.value]) + " " + to.value;
        $("money-note").textContent = "Rate date: " + d.date + " (updated on working days).";
      } catch (e) { if (me === latest) out.textContent = NET_ERR; }
    }
    $("money-go").onclick = convert;
    $("money-amt").addEventListener("input", convert);
    from.addEventListener("change", convert);
    to.addEventListener("change", convert);
    $("money-swap").onclick = () => { [from.value, to.value] = [to.value, from.value]; convert(); };
    try {
      const list = await apiGet("https://api.frankfurter.dev/v1/currencies");
      Object.keys(list).sort().forEach((code) => {
        const label = code + " – " + list[code];
        from.add(new Option(label, code)); to.add(new Option(label, code));
      });
      from.value = "USD"; to.value = list.MYR ? "MYR" : "EUR";
      convert();
    } catch (e) { out.textContent = NET_ERR; }
  }
});

// word detective
(window.TOOLS ||= []).push({
  id: "define", title: "Word Detective", emoji: "📖",
  desc: "Look up meanings, examples and pronunciation of English words.",
  cat: "api", kw: "dictionary definition meaning vocabulary pronounce live api",
  html: `
<h2>Word Detective</h2><p class="hint">Type one English word. Data from the Free Dictionary API.</p>
<label for="define-in">Word</label><input type="text" id="define-in" placeholder="serendipity" autocomplete="off">
<div class="row"><button class="btn" id="define-go">Look it up</button></div>
<div class="result" id="define-out" aria-live="polite">The meaning shows up here.</div>
  `,
  init() {
    const out = $("define-out");
    let latest = 0;
    async function go() {
      const w = $("define-in").value.trim();
      if (!w) { out.textContent = "Type a word first."; return; }
      const me = ++latest; out.textContent = "Looking…";
      try {
        const d = (await apiGet("https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(w)))[0];
        if (me !== latest) return;
        const ph = (d.phonetics || []).find((p) => p.text) || {}, audio = (d.phonetics || []).find((p) => p.audio);
        out.textContent = "";
        out.append(mk("div", "big", d.word + (d.phonetic || ph.text ? "  " + (d.phonetic || ph.text) : "")));
        if (audio) { const b = mk("button", "btn alt", "🔊 Hear it"); b.onclick = () => new Audio(audio.audio).play().catch(() => {}); out.append(b); }
        d.meanings.slice(0, 4).forEach((m) => {
          out.append(mk("p", null, m.partOfSpeech));
          const ol = mk("ol", "list");
          m.definitions.slice(0, 2).forEach((df) => {
            const li = mk("li", null, df.definition);
            if (df.example) li.append(document.createElement("br"), mk("em", null, "“" + df.example + "”"));
            ol.append(li);
          });
          out.append(ol);
        });
      } catch (e) {
        if (me === latest) out.textContent = e.status === 404 ? "No definition found for “" + w + "”. Check the spelling." : NET_ERR;
      }
    }
    $("define-go").onclick = go;
    $("define-in").addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  }
});

// country cards
(window.TOOLS ||= []).push({
  id: "country", title: "Country Cards", emoji: "🌍",
  desc: "Flag, capital, population, languages and currency.",
  cat: "api", kw: "country nation flag capital geography population language currency live api",
  html: `
<h2>Country Cards</h2><p class="hint">Type a country name (or part of it). Data from REST Countries.</p>
<label for="country-in">Country</label><input type="text" id="country-in" placeholder="Malaysia" autocomplete="off">
<div class="row"><button class="btn" id="country-go">Find it</button></div>
<div class="result" id="country-out" aria-live="polite">Country details show up here.</div>
  `,
  init() {
    const out = $("country-out");
    let latest = 0;
    async function go() {
      const q = $("country-in").value.trim();
      if (!q) { out.textContent = "Type a country name first."; return; }
      const me = ++latest; out.textContent = "Searching…";
      try {
        const res = await apiGet("https://restcountries.com/v3.1/name/" + encodeURIComponent(q) + "?fields=name,capital,population,region,subregion,flags,languages,currencies,area");
        if (me !== latest) return;
        out.textContent = "";
        res.slice(0, 3).forEach((c) => {
          const card = mk("div", null); card.style.marginBottom = "18px";
          const img = mk("img"); img.src = c.flags.png; img.alt = c.flags.alt || "Flag of " + c.name.common; img.style.cssText = "max-height:70px;border:3px solid var(--ink);border-radius:8px";
          const cur = Object.values(c.currencies || {}).map((x) => x.name + (x.symbol ? " (" + x.symbol + ")" : "")).join(", ");
          const rows = [
            ["Capital", (c.capital || []).join(", ")], ["Region", [c.subregion, c.region].filter(Boolean).join(", ")],
            ["Population", c.population.toLocaleString()], ["Area", Math.round(c.area).toLocaleString() + " km²"],
            ["Languages", Object.values(c.languages || {}).join(", ")], ["Currency", cur]
          ].filter((r) => r[1]);
          const ul = mk("ul", "list"); rows.forEach(([k, v]) => ul.append(mk("li", null, k + ": " + v)));
          card.append(img, mk("div", "big", c.name.common), mk("p", "hint", c.name.official), ul);
          out.append(card);
        });
      } catch (e) {
        if (me === latest) out.textContent = e.status === 404 ? "No country found for “" + q + "”." : NET_ERR;
      }
    }
    $("country-go").onclick = go;
    $("country-in").addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  }
});

// dog finder
(window.TOOLS ||= []).push({
  id: "dog", title: "Dog Finder", emoji: "🐶",
  desc: "A random dog photo, any breed or one you pick.",
  cat: "api", kw: "dog puppy photo picture breed random cute live api",
  html: `
<h2>Dog Finder</h2><p class="hint">Press the button for a new good boy or girl. Photos from Dog CEO.</p>
<label for="dog-breed">Breed</label><select id="dog-breed"><option value="">Any breed</option></select>
<div class="row"><button class="btn" id="dog-go">Fetch a dog</button></div>
<div class="result center" id="dog-out" aria-live="polite">Press the button.</div>
  `,
  init() {
    const out = $("dog-out");
    let latest = 0;
    async function go() {
      const b = $("dog-breed").value, me = ++latest;
      out.textContent = "Fetching…";
      try {
        const d = await apiGet(b ? "https://dog.ceo/api/breed/" + encodeURIComponent(b) + "/images/random" : "https://dog.ceo/api/breeds/image/random");
        if (me !== latest) return;
        const img = mk("img"); img.alt = b ? "A random " + b : "A random dog"; img.style.maxHeight = "420px";
        img.onerror = () => { out.textContent = "The photo could not load. Try again."; };
        img.src = d.message;
        out.textContent = ""; out.append(img);
      } catch (e) { if (me === latest) out.textContent = NET_ERR; }
    }
    $("dog-go").onclick = go;
    $("dog-breed").addEventListener("change", go);
    apiGet("https://dog.ceo/api/breeds/list/all")
      .then((d) => Object.keys(d.message).forEach((n) => $("dog-breed").add(new Option(n[0].toUpperCase() + n.slice(1), n))))
      .catch(() => {});                                  // breed list is a nice-to-have; "Any breed" still works
  }
});
