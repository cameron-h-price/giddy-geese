/*
 * Shared by events.js and home.js so both pages agree on when an event
 * starts and ends.
 *
 * time may be a single start ("22:00") or a range ("18:00-23:00").
 * With no range, the end is start + duration hours (default 6).
 */
function withEventTimes(event) {
  const [startTime, endTime] = (event.time ?? '').split('-').map(t => t.trim());
  const _when = new Date(`${event.date}T${startTime}`);
  let _end;
  if (endTime) {
    _end = new Date(`${event.date}T${endTime}`);
    if (_end <= _when) _end = new Date(_end.getTime() + 24 * 60 * 60 * 1000); // runs past midnight
  } else {
    const durationHours = event.duration ?? 6;
    _end = new Date(_when.getTime() + durationHours * 60 * 60 * 1000);
  }
  return { ...event, _when, _end };
}
