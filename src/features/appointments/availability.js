const FIRST_SLOT_MINUTES = 8 * 60;
const LAST_SLOT_MINUTES = 18 * 60;
const SLOT_INTERVAL_MINUTES = 30;

export const AVAILABILITY_SLOTS = Array.from(
  { length: (LAST_SLOT_MINUTES - FIRST_SLOT_MINUTES) / SLOT_INTERVAL_MINUTES },
  (_, index) => {
    const minutes = FIRST_SLOT_MINUTES + index * SLOT_INTERVAL_MINUTES;
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  },
);

export function isAvailabilitySlot(value) {
  return AVAILABILITY_SLOTS.includes(value);
}
