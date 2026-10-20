export type HwpRecord = {
  tagId: number;
  level: number;
  size: number;
  data: Uint8Array;
};

/**
 * 스트림을 받아 레코드 배열을 반환하는 함수
 */
export function parseHwpRecord(bytes: Uint8Array): HwpRecord[] {
  const hwpRecords: HwpRecord[] = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;

  while (offset < bytes.byteLength) {
    if (offset + 4 > bytes.byteLength) {
      throw new Error("레코드 헤더가 잘렸습니다.");
    }

    const header = view.getUint32(offset, true);
    offset += 4;

    const tagId = header & 0x3ff;
    const level = (header >>> 10) & 0x3ff;
    let size = (header >>> 20) & 0xfff;

    // 레코드의 길이가 4095 바이트 이상이라면
    if (size === 0xfff) {
      if (offset + 4 > bytes.byteLength) {
        throw new Error("확장 레코드 크기가 잘렸습니다.");
      }

      size = view.getUint32(offset, true);
      offset += 4;
    }

    if (offset + size > bytes.byteLength) {
      throw new Error("레코드 데이터가 스트림 범위를 벗어납니다.");
    }

    hwpRecords.push({
      tagId,
      level,
      size,
      data: bytes.subarray(offset, offset + size),
    });

    offset += size;
  }

  return hwpRecords;
}
