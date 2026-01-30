/**
 * Ensures a URL is absolute by adding a protocol if missing.
 * If the URL is already absolute (starts with http:// or https://) or is a relative path (starts with /),
 * it is returned as is. Otherwise, it prefixes it with https://.
 * 
 * @param {string} url - The URL to normalize.
 * @returns {string} - The normalized absolute URL.
 */
export const ensureAbsoluteUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  
  const trimmedUrl = url.trim();
  
  // If it's already absolute or a relative path, return it
  if (/^(https?:\/\/|\/)/i.test(trimmedUrl)) {
    return trimmedUrl;
  }
  
  // Otherwise, assume it needs a protocol. default to https
  return `https://${trimmedUrl}`;
};
