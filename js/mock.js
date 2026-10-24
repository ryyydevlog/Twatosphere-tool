/* ---------- TOOL 3: MOCKING TEXT ----------
   Walk through each character. Letters alternate lower / UPPER;
   spaces and symbols are kept but do not advance the counter. */
function mockify(text) {
  let isUpper = false;
  return [...text].map((ch) => {
    if (!/[a-z]/i.test(ch)) return ch;      // not a letter: leave it alone
    isUpper = !isUpper;                     // flip between lower and upper
    return isUpper ? ch.toLowerCase() : ch.toUpperCase();
  }).join("");
}
const mockIn = $("mock-in");
const renderMock = () => { $("mock-out").textContent = mockify(mockIn.value); };
mockIn.addEventListener("input", renderMock);   // "input" fires on every keystroke
renderMock();                                    // run once so the box isn't empty
