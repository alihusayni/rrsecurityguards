import { NextRequest, NextResponse } from 'next/server';

const GA4_MEASUREMENT_ID = 'G-VFBS37KZ4K';
const GA4_API_SECRET = process.env.GA4_API_SECRET || '';
const GA4_ENDPOINT = `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`;

// IPs to exclude — set ANALYTICS_BLOCKED_IPS in Vercel env vars (comma-separated)
const BLOCKED_IPS = (process.env.ANALYTICS_BLOCKED_IPS || '')
    .split(',')
    .map(ip => ip.trim())
    .filter(Boolean);

function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return '';
}

export async function POST(request: NextRequest) {
    try {
        const clientIp = getClientIp(request);
        if (clientIp && BLOCKED_IPS.includes(clientIp)) {
            return new NextResponse(null, { status: 204 });
        }

        const text = await request.text();
        const body = JSON.parse(text);

        if (!body?.client_id || !Array.isArray(body?.events)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        if (body.events.length > 25) {
            body.events = body.events.slice(0, 25);
        }

        const userAgent = request.headers.get('user-agent') || '';

        fetch(GA4_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // User-Agent header is how GA4 MP detects device/browser — NOT a body field
                ...(userAgent ? { 'User-Agent': userAgent } : {}),
            },
            body: JSON.stringify({
                client_id: body.client_id,
                events: body.events,
                // user_ip_override IS a valid MP body field — enables accurate geo data
                ...(clientIp ? { user_ip_override: clientIp } : {}),
            }),
        }).catch(() => {});

        return new NextResponse(null, { status: 204 });
    } catch {
        return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }
}
