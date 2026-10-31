// Upload guards shared by the admin upload routes. File.type and the name are
// whatever the browser claims, so images are also checked by their leading
// bytes. Size caps stop a huge (or zip-bomb) workbook from pinning the CPU
// while ExcelJS parses it.

const MB = 1024 * 1024;
export const MAX_IMAGE_BYTES = 10 * MB;
export const MAX_SHEET_BYTES = 10 * MB;

// Raster formats only. SVG is deliberately excluded: it can carry script.
const IMAGE_SIGNATURES: { type: string; test: (b: Uint8Array) => boolean }[] = [
  { type: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    type: "image/png",
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  { type: "image/gif", test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  {
    // RIFF....WEBP
    type: "image/webp",
    test: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
  {
    // ....ftypavif / ftypavis
    type: "image/avif",
    test: (b) =>
      b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 &&
      b[8] === 0x61 && b[9] === 0x76 && b[10] === 0x69,
  },
];

/** Returns an error message, or null if the file is an acceptable image. */
export async function checkImageUpload(file: File): Promise<string | null> {
  if (file.size === 0) return "The file is empty.";
  if (file.size > MAX_IMAGE_BYTES)
    return `Images must be ${MAX_IMAGE_BYTES / MB} MB or smaller.`;
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!IMAGE_SIGNATURES.some((s) => s.test(head)))
    return "Only JPEG, PNG, GIF, WebP or AVIF images are allowed.";
  return null;
}

/** Returns an error message, or null if the file looks like a spreadsheet. */
export function checkSpreadsheetUpload(file: File): string | null {
  if (file.size === 0) return "The file is empty.";
  if (file.size > MAX_SHEET_BYTES)
    return `Spreadsheets must be ${MAX_SHEET_BYTES / MB} MB or smaller.`;
  if (!/\.(xlsx|xls|csv)$/i.test(file.name || ""))
    return "Upload an Excel (.xlsx, .xls) or CSV file.";
  return null;
}
