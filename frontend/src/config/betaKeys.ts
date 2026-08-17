// Beta Access Verification System
// Verification is now fully handled by the backend API.

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://shiuli-backend.onrender.com';

/**
 * Verify if an Email ID and 5-digit code match correctly via backend API endpoint /api/beta/verify
 */
export async function verifyBetaAccessAsync(email: string, code: string): Promise<{ success: boolean; message: string; name?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'দয়া করে একটি সঠিক ইমেল আইডি দিন (Please enter a valid email).' };
  }

  if (!cleanCode || cleanCode.length !== 5 || isNaN(Number(cleanCode))) {
    return { success: false, message: 'দয়া করে ৫-সংখ্যার সঠিক বিটা কোড দিন (Please enter a valid 5-digit code).' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout for Render cold starts

    const response = await fetch(`${API_BASE_URL}/api/beta/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, access_code: cleanCode }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.valid) {
        return { 
          success: true, 
          message: 'বিটা অ্যাক্সেস সফল হয়েছে! (Beta Access Granted)',
          name: data.user?.name || 'Beta User'
        };
      } else {
        return { success: false, message: data.message || 'ভুল ইমেল বা বিটা কোড। (Invalid email or 5-digit access code)' };
      }
    } else {
      return { success: false, message: 'সার্ভার সমস্যা, পরে আবার চেষ্টা করুন। (Server error, please try again)' };
    }
  } catch (err) {
    console.error("Backend verification failed:", err);
    return { success: false, message: 'নেটওয়ার্ক সমস্যা, আপনার ইন্টারনেট সংযোগ চেক করুন। (Network error, please check your connection)' };
  }
}
