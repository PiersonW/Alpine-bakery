import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "../../../lib/settings";

// Never cache this route -- caching an API endpoint (especially one with
// a PUT handler) can cause stale error responses to keep being served
// even after the underlying code is fixed.
export const dynamic = "force-dynamic";

// Anyone can read the current pickup window (the cart page needs it to
// build the time dropdown); only an authenticated admin can change it --
// see middleware.js, which requires auth for every method except GET here.
export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings, {
    headers: { "Cache-Control": "no-store, must-revalidate" },
  });
}

export async function PUT(request) {
  const { pickup_start, pickup_end, pickup_interval_minutes } = await request.json();

  if (!/^\d{2}:\d{2}$/.test(pickup_start) || !/^\d{2}:\d{2}$/.test(pickup_end)) {
    return NextResponse.json({ error: "Invalid time format." }, { status: 400 });
  }
  if (pickup_start >= pickup_end) {
    return NextResponse.json(
      { error: "Start time must be before end time." },
      { status: 400 }
    );
  }
  const interval = Number(pickup_interval_minutes);
  if (![15, 30, 60].includes(interval)) {
    return NextResponse.json({ error: "Invalid interval." }, { status: 400 });
  }

  await updateSettings({ pickup_start, pickup_end, pickup_interval_minutes: interval });
  return NextResponse.json({ ok: true });
}
