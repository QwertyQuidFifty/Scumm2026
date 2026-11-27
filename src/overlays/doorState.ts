/**
 * Door overlays draw either the open or the closed state of a door over a
 * background that paints the other one. Whether the door is open depends on
 * which state the overlay draws and whether it is currently shown.
 *
 * No runtime dependencies, so it can be unit-tested in Node.
 */
export type DoorDepiction = "open" | "closed";

export function isDoorOpen(
  depicts: DoorDepiction,
  overlayVisible: boolean,
): boolean {
  return depicts === "open" ? overlayVisible : !overlayVisible;
}
