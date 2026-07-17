import { NextResponse } from "next/server";

// GA4 relay removed — analytics handled by Despora pixel (ClickHouse).
export async function POST() {
  return NextResponse.json({ ok: true });
}
