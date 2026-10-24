/* ---------- TOOL 2: IMAGE CONVERTER ----------
   Steps: read the file -> draw it on an invisible canvas -> ask the canvas
   to export itself in the chosen format -> show the result as an <img>.
   Everything happens locally; the file never leaves the device. */
$("img-go").addEventListener("click", () => {
  const file = $("img-file").files[0];
  const out = $("img-out");
  if (!file) { out.textContent = "Choose an image file first."; return; }

  const url = URL.createObjectURL(file);    // a temporary local link to the file
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";                 // JPG has no transparency, so paint white behind it
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);               // free the temporary link
    // 0.92 = quality for JPG and WebP (PNG ignores it)
    canvas.toBlob((blob) => {
      out.innerHTML = "";
      const result = document.createElement("img");
      result.src = URL.createObjectURL(blob);
      result.alt = "Converted image";
      out.appendChild(result);
    }, $("img-fmt").value, 0.92);
  };
  img.onerror = () => { out.textContent = "That file could not be read as an image."; };
  img.src = url;
});
