import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory store for rate limiting
// In production, consider using a more robust solution like Redis
const rateLimits = new Map<string, { count: number; resetAt: number }>();

// Rate limit configuration
const RATE_LIMIT = 100; // 100 requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

export async function middleware(request: NextRequest) {
  // Skip rate limiting for static files and API routes that don't need it
  if (request.nextUrl.pathname.startsWith('/_next') || 
      request.nextUrl.pathname.startsWith('/static') ||
      request.nextUrl.pathname.includes('.')) {
    return NextResponse.next();
  }

  // Get client IP (consider using a proxy like Nginx in production)
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  // Get or initialize rate limit data for this IP
  const now = Date.now();
  const rateLimit = rateLimits.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  
  // Reset the counter if the window has passed
  if (now > rateLimit.resetAt) {
    rateLimit.count = 0;
    rateLimit.resetAt = now + RATE_LIMIT_WINDOW;
  }

  // Increment the counter
  rateLimit.count += 1;
  rateLimits.set(ip, rateLimit);

  // Set rate limit headers
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT.toString());
  response.headers.set('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT - rateLimit.count).toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimit.resetAt / 1000).toString());

  // Check if rate limit is exceeded
  if (rateLimit.count > RATE_LIMIT) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(rateLimit.resetAt / 1000).toString()
        }
      }
    );
  }

  return response;
}

// Configure which paths should use rate limiting
export const config = {
  matcher: [
    '/api/:path*', // Rate limit all API routes
  ],
};
