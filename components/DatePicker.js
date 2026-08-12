"use client";

import { useState } from "react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * A small month-at-a-time calendar. Past dates and anything in
 * `disabledDates` (a Set of "YYYY-MM-DD" strings) can't be picked.
 * `minDateKey`, if given, disables any date earlier than it (used to
 * enforce a minimum advance-notice window) with the same "unavailable"
 * styling as an admin-blocked date, just a different tooltip.
 * `monthsAhead` caps how far into the future someone can browse/pick.
 */
export default function DatePicker({
  selected,
  selectedDates,
  onSelect,
  disabledDates,
  blockedDates,
  minDateKey,
  monthsAhead = 3,
}) {
  const today = startOfToday();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const maxMonth = new Date(today.getFullYear(), today.getMonth() + monthsAhead, 1);
  const atEarliest = year === today.getFullYear() && month === today.getMonth();
  const atLatest = year === maxMonth.getFullYear() && month === maxMonth.getMonth();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));

  return (
    <div className="datepicker">
      <div className="datepicker-header">
        <button
          type="button"
          className="datepicker-nav"
          disabled={atEarliest}
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          aria-label="Previous month"
        >
          &lsaquo;
        </button>
        <span className="datepicker-month">{MONTH_NAMES[month]} {year}</span>
        <button
          type="button"
          className="datepicker-nav"
          disabled={atLatest}
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          aria-label="Next month"
        >
          &rsaquo;
        </button>
      </div>
      <div className="datepicker-grid datepicker-labels">
        {DAY_LABELS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="datepicker-grid">
        {cells.map((date, i) => {
          if (!date) return <span key={i} />;
          const key = toDateKey(date);
          const isPast = date < today;
          const isFlaggedBlocked = blockedDates?.has(key);
          const isHardDisabled = disabledDates?.has(key);
          const isTooSoon = Boolean(minDateKey) && key < minDateKey;
          const isDisabled = isPast || isHardDisabled || isTooSoon;
          const showUnavailableStyle = (isFlaggedBlocked || isTooSoon) && !isPast;
          const isSelected = selected === key || Boolean(selectedDates?.has(key));

          let title;
          if (!isPast) {
            if (isFlaggedBlocked) title = "Not available for pickup";
            else if (isTooSoon) title = "Needs at least 48 hours notice";
          }

          return (
            <button
              type="button"
              key={i}
              disabled={isDisabled}
              onClick={() => onSelect(key)}
              className={
                "datepicker-day" +
                (isSelected ? " is-selected" : "") +
                (showUnavailableStyle ? " is-blocked" : "") +
                (isPast ? " is-past" : "")
              }
              title={title}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
      <p className="datepicker-legend">
        <span className="legend-dot legend-available" /> Available
        <span className="legend-dot legend-blocked" style={{ marginLeft: "12px" }} /> Unavailable
      </p>
    </div>
  );
}
