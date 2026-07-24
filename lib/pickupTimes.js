// Pickup time options shown at checkout, in 30-minute increments.
// Adjust START_HOUR / END_HOUR (24-hour clock) if your pickup window changes.
const START_HOUR = 8; // 8:00 AM
const END_HOUR = 18; // 6:00 PM

function pad(n) {
  return n.toString().padStart(2, "0");
}

export const PICKUP_TIMES = (() => {
  const times = [];
  for (
    let totalMinutes = START_HOUR * 60;
    totalMinutes <= END_HOUR * 60;
    totalMinutes += 30
  ) {
    const hour24 = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const ampm = hour24 < 12 ? "AM" : "PM";
    times.push({
      value: `${pad(hour24)}:${pad(minute)}`,
      label: `${hour12}:${pad(minute)} ${ampm}`,
    });
  }
  return times;
})();

// Converts a stored "HH:MM" (24-hour) value back into a friendly label,
// e.g. "14:30" -> "2:30 PM". Used anywhere we display a saved pickup time.
export function formatPickupTime(value) {
  if (!value) return "";
  const match = PICKUP_TIMES.find((t) => t.value === value);
  return match ? match.label : value;
}
