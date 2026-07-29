/**
 * HydroNourish — OTP Rate Limiter & Anti-Spam Utility
 * Heritage Animal Clinic Capstone Project
 *
 * Prevents rapid automated or manual spam requests for 2FA verification codes.
 * Enforces a maximum rate limit per email address within a rolling window.
 */

interface RateLimitResult {
  allowed: boolean;
  waitSeconds: number;
}

const requestHistory: Record<string, number[]> = {};

/**
 * Checks if an email has exceeded the allowed OTP request frequency.
 * @param email - Target email address
 * @param maxRequests - Max allowed requests within the time window (default: 3)
 * @param windowMs - Time window in milliseconds (default: 60,000ms = 1 min)
 */
export function checkOtpRateLimit(
  email: string,
  maxRequests: number = 3,
  windowMs: number = 60000
): RateLimitResult {
  const normalizedEmail = email.trim().toLowerCase();
  const now = Date.now();

  if (!requestHistory[normalizedEmail]) {
    requestHistory[normalizedEmail] = [];
  }

  // Filter timestamps within the rolling window
  requestHistory[normalizedEmail] = requestHistory[normalizedEmail].filter(
    (ts) => now - ts < windowMs
  );

  // If request count exceeds allowed max in window, deny with remaining wait seconds
  if (requestHistory[normalizedEmail].length >= maxRequests) {
    const oldestTimestamp = requestHistory[normalizedEmail][0];
    const elapsedMs = now - oldestTimestamp;
    const remainingMs = Math.max(0, windowMs - elapsedMs);
    const waitSeconds = Math.ceil(remainingMs / 1000);

    return {
      allowed: false,
      waitSeconds: waitSeconds > 0 ? waitSeconds : 15,
    };
  }

  // Log current request timestamp
  requestHistory[normalizedEmail].push(now);

  return {
    allowed: true,
    waitSeconds: 0,
  };
}
