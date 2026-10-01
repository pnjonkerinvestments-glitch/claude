export type MapCamera = { x: number; y: number; zoom: number };
export const initialCamera: MapCamera = { x: 0, y: 0, zoom: 1 };
export function clampCamera(c: MapCamera): MapCamera {
  const zoom = Math.max(1, Math.min(64, c.zoom));
  return { zoom, x: Math.max(0, Math.min(1000 - 1000 / zoom, c.x)), y: Math.max(0, Math.min(500 - 500 / zoom, c.y)) };
}
export function zoomCamera(c: MapCamera, zoom: number, anchor: number[] = [c.x + 500 / c.zoom, c.y + 250 / c.zoom], fraction = [.5, .5]): MapCamera {
  zoom = Math.max(1, Math.min(64, zoom));
  return clampCamera({ zoom, x: anchor[0] - fraction[0] * 1000 / zoom, y: anchor[1] - fraction[1] * 500 / zoom });
}
export function panCamera(c: MapCamera, delta: number[]) { return clampCamera({ ...c, x: c.x - delta[0] * 1000 / c.zoom, y: c.y - delta[1] * 500 / c.zoom }); }
/** A camera that shows a [south, west, north, east] box in degrees on the 1000×500 world map. */
export function cameraForBox(box: [number, number, number, number]): MapCamera {
  const [s, w, n, e] = box;
  const x0 = (w + 180) / 360 * 1000, x1 = (e + 180) / 360 * 1000, y0 = (90 - n) / 180 * 500, y1 = (90 - s) / 180 * 500;
  const zoom = Math.max(1, Math.min(8, 1000 / Math.max(1, x1 - x0), 500 / Math.max(1, y1 - y0)));
  return clampCamera({ zoom, x: (x0 + x1) / 2 - 500 / zoom, y: (y0 + y1) / 2 - 250 / zoom });
}
