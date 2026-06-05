'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Generates or retrieves a persistent GA4 client ID
function getClientId(): string {
    const key = '_ga_cid';
    let id = '';
    try {
        id = document.cookie.split('; ').find(c => c.startsWith(`${key}=`))?.split('=')[1] || '';
        if (!id) {
            id = `${Math.random().toString(36).slice(2)}.${Date.now()}`;
            document.cookie = `${key}=${id}; max-age=${2 * 365 * 24 * 60 * 60}; path=/; SameSite=Lax`;
        }
    } catch {}
    return id;
}

function sendPageView() {
    const clientId = getClientId();
    const payload = {
        client_id: clientId,
        events: [{
            name: 'page_view',
            params: {
                session_id: String(Math.floor(Date.now() / 1000)),
                engagement_time_msec: '100',
                page_location: window.location.href,
                page_title: document.title,
            },
        }],
    };
    const data = JSON.stringify(payload);
    if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics', new Blob([data], { type: 'application/json' }));
    } else {
        fetch('/api/analytics', { method: 'POST', body: data, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
    }
}

export function Analytics() {
    const pathname = usePathname();
    const lastPathRef = useRef('');

    useEffect(() => {
        if (pathname !== lastPathRef.current) {
            lastPathRef.current = pathname;
            sendPageView();
        }
    }, [pathname]);

    return null;
}
