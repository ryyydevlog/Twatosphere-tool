/* ---------- WORD COUNTER ----------
   split(/\s+/) cuts on any whitespace; filter(Boolean) drops empty pieces.
   Reading time assumes about 200 words per minute. */
function countWords() {
  const t = $("words-in").value;
  const words = t.split(/\s+/).filter(Boolean).length;
  const sentences = (t.match(/[.!?]+/g) || []).length;
  const mins = Math.max(words ? 1 : 0, Math.round(words / 200));
  const stat = (n, label) => "<div class='stat'><b>" + n + "</b>" + label + "</div>";
  $("words-out").innerHTML = stat(words, "words") + stat(t.length, "characters") + stat(sentences, "sentences") + stat(mins, "min to read");
}
$("words-in").addEventListener("input", countWords);
countWords();
