import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Health Check Endpoint
 *
 * Tests the application and database connectivity.
 * Returns 200 OK if healthy, 503 Service Unavailable if unhealthy.
 *
 * Response format:
 * {
 *   status: "healthy" | "unhealthy",
 *   timestamp: ISO 8601 timestamp,
 *   database: "connected" | "disconnected",
 *   uptime: process uptime in seconds,
 *   version: NODE_ENV
 * }
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`;

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
      version: process.env.NODE_ENV || 'development',
      responseTime: `${responseTime}ms`
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      uptime: process.uptime(),
      version: process.env.NODE_ENV || 'development',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}
