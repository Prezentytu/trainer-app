/** Kompresja screenów przed vision — max krawędź ~1600 px, JPEG, bez trzymania oryginału. */

export const HISTORY_IMPORT_MAX_IMAGES = 15;
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;
const PHOTO_MAX_EDGE = 1200;
const PHOTO_QUALITY = 0.72;
const PHOTO_MAX_BYTES = 512 * 1024;

export async function fileToHistoryImage(file: File): Promise<{ mimeType: string; base64: string }> {
  const drawn = await drawToJpeg(file, MAX_EDGE, JPEG_QUALITY);
  if (drawn) return drawn;
  const mime = file.type || "image/jpeg";
  if (!/^image\/(jpeg|jpg|png|webp|gif)$/i.test(mime)) {
    throw new Error(`Nieobsługiwany format: ${file.name}. Wrzuć zdjęcie JPG, PNG albo WebP.`);
  }
  return { mimeType: mime === "image/jpg" ? "image/jpeg" : mime, base64: await blobToBase64(file) };
}

/** Zdjęcie sylwetki: JPEG, max 1200 px, ~500 KB. */
export async function compressImageFile(file: File): Promise<{ base64: string; contentType: string }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Wybierz zwykłe zdjęcie.");
  }
  const drawn = await drawToJpeg(file, PHOTO_MAX_EDGE, PHOTO_QUALITY);
  if (!drawn) throw new Error("Nie udało się przygotować zdjęcia.");
  const raw = atob(drawn.base64);
  if (raw.length > PHOTO_MAX_BYTES) {
    throw new Error("Zdjęcie jest nadal za duże. Wybierz inne albo zrób zdjęcie z mniejszą rozdzielczością.");
  }
  return { base64: drawn.base64, contentType: "image/jpeg" };
}

async function drawToJpeg(
  file: File,
  maxEdge: number,
  quality: number,
): Promise<{ mimeType: string; base64: string } | null> {
  if (typeof window === "undefined") return null;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
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
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) return null;
  return { mimeType: "image/jpeg", base64: await blobToBase64(blob) };
}

const FORM_CHECK_MAX_VIDEO = 4 * 1024 * 1024;

/** Form check: skompresowane zdjęcie albo krótki film (max 4 MB). */
export async function fileToFormCheck(
  file: File,
): Promise<{ fileBase64: string; contentType: string; fileName: string }> {
  if (file.type.startsWith("image/")) {
    const compressed = await compressImageFile(file);
    return { fileBase64: compressed.base64, contentType: compressed.contentType, fileName: file.name };
  }
  if (!/^video\/(mp4|webm|quicktime)$/i.test(file.type)) {
    throw new Error("Wybierz krótki film albo zdjęcie.");
  }
  if (file.size > FORM_CHECK_MAX_VIDEO) {
    throw new Error("Film jest za duży — nagraj krótszy klip (max. 4 MB).");
  }
  return { fileBase64: await blobToBase64(file), contentType: file.type, fileName: file.name };
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
