import * as CFB from "cfb";

export function openHwpContainer(buf: ArrayBuffer) {
  const container = CFB.parse(new Uint8Array(buf), { raw: true });
  return container;
}
