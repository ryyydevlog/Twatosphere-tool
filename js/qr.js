/* ---------- TOOL 1: QR CODE ----------
   The qrcode.js library takes a container element and some options,
   then draws the code inside it. We clear the box first so old codes vanish. */
$("qr-go").addEventListener("click", () => {
  const text = $("qr-text").value.trim();
  const box = $("qr-out");
  if (!text) { box.textContent = "Type something first, then press the button."; return; }
  if (typeof QRCode === "undefined") { box.textContent = "The QR library did not load. Check your connection and reload."; return; }
  box.innerHTML = "";                       // remove the previous code
  new QRCode(box, { text, width: 220, height: 220, colorDark: "#1b1340", colorLight: "#ffffff" });
});
