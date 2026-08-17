/**
 * Safe local storage wrapper that encodes data in Base64 to prevent plaintext exposure in DevTools.
 * Uses encodeURIComponent to support Unicode/Bengali characters safely.
 */
export const secureSetItem = (key: string, value: any): void => {
  try {
    const jsonStr = JSON.stringify(value);
    const encoded = btoa(encodeURIComponent(jsonStr));
    localStorage.setItem(key, encoded);
  } catch (e) {
    console.warn("Failed to secure store key:", key, e);
  }
};

export const secureGetItem = <T>(key: string): T | null => {
  try {
    const encoded = localStorage.getItem(key);
    if (!encoded) return null;
    const jsonStr = decodeURIComponent(atob(encoded));
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    // If it's old plaintext data or parsing fails, return null to force a reload
    return null;
  }
};
