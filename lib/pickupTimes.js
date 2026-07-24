function pad(n) {
  return n.toString().padStart(2, "0");
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// Builds the list of selectable pickup times between two "HH:MM" (24-hour)
// values, spaced by intervalMinutes. Used to render the dropdown on the
// cart page based on whatever window the owner has set in /admin.
export function generatePickupTimes(startStr = "08:00", endStr = "18:00", intervalMinutes = 30) {
  const start = toMinutes(startStr);
  const end = toMinutes(endStr);
  const times = [];
  for (let total = start; total <= end; total += intervalMinutes) {
    const hour24 = Math.floor(total / 60);
    const minute = total % 60;
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const ampm = hour24 < 12 ? "AM" : "PM";
    times.push({
      value: `${pad(hour24)}:${pad(minute)}`,
      label: `${hour12}:${pad(minute)} ${ampm}`,
    });
  }
  return times;
}

// Converts a stored "HH:MM" (24-hour) value into a friendly label,
// e.g. "14:30" -> "2:30 PM".
export function formatPickupTime(value) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return value || "";
  const [h, m] = value.split(":").map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hour12}:${pad(m)} ${ampm}`;
}
