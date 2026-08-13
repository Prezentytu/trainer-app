/** Kompresja screenów przed vision — max krawędź ~1600 px, JPEG, bez trzymania oryginału. */

export const HISTORY_IMPORT_MAX_IMAGES = 15;
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

export async function fileToHistoryImage(file: File): Promise<{ mimeType: string; base64: string }> {
  const drawn = await drawToJpeg(file);
  if (drawn) return drawn;
  const mime = file.type || "image/jpeg";
  if (!/^image\/(jpeg|jpg|png|webp|gif)$/i.test(mime)) {
    throw new Error(`Nieobsługiwany format: ${file.name}. Wrzuć JPG, PNG albo WebP.`);
  }
  return { mimeType: mime === "image/jpg" ? "image/jpeg" : mime, base64: await blobToBase64(file) };
}

async function drawToJpeg(file: File): Promise<{ mimeType: string; base64: string } | null> {
  if (typeof window === "undefined") return null;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return null;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) return null;
  return { mimeType: "image/jpeg", base64: await blobToBase64(blob) };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result ?? "");
      const comma = s.indexOf(",");
      resolve(comma >= 0 ? s.slice(comma + 1) : s);
    };
    reader.onerror = () => reject(new Error("Nie udało się odczytać pliku."));
    reader.readAsDataURL(blob);
  });
}
