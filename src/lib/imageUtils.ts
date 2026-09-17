/**
 * Image Utilities for Lumina Home
 * Transforms external image URLs (like Google Drive share links) into direct media stream URLs.
 */

/**
 * Extracts Google Drive file ID from various link formats and converts it into
 * a high-speed direct image CDN stream URL via Google's usercontent infrastructure.
 */
export function formatGoogleDriveUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();

  // If it's already a direct Google CDN link
  if (trimmed.includes("googleusercontent.com/d/")) {
    if (!trimmed.includes("=") && !trimmed.includes("&")) {
      return `${trimmed}=s0`;
    }
    return trimmed;
  }

  // Common Google Drive link formats:
  // 1. https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // 2. https://drive.google.com/file/d/FILE_ID/view
  // 3. https://drive.google.com/open?id=FILE_ID
  // 4. https://drive.google.com/uc?id=FILE_ID
  // 5. https://drive.google.com/uc?export=view&id=FILE_ID
  // 6. https://docs.google.com/file/d/FILE_ID/...
  const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/i;
  const match = trimmed.match(driveRegex);

  if (match && match[1]) {
    const fileId = match[1];
    // Google's direct media CDN URL with =s0 for original full uncompressed resolution
    return `https://lh3.googleusercontent.com/d/${fileId}=s0`;
  }

  // If it's Unsplash, upgrade resolution parameter to high-res
  if (trimmed.includes("images.unsplash.com") && trimmed.includes("q=80")) {
    return trimmed.replace(/q=80/g, "q=95&auto=format&fit=crop&w=1600");
  }

  return trimmed;
}

/**
 * Checks if a given string looks like a Google Drive link
 */
export function isGoogleDriveUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  return /drive\.google\.com|docs\.google\.com|googleusercontent\.com\/d\//i.test(rawUrl);
}

/**
 * Normalizes any image URL. If it's a Google Drive link, converts it to a direct CDN stream URL.
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  return formatGoogleDriveUrl(url);
}

/**
 * Normalizes an array or newline/comma-separated list of image URLs.
 */
export function normalizeImagesList(images: string[] | string | undefined | null): string[] {
  if (!images) return [];
  const rawList = Array.isArray(images)
    ? images
    : images.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);

  return rawList.map((url) => normalizeImageUrl(url)).filter(Boolean);
}
