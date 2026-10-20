import { CFB$Container, find, parse } from "cfb";
import { FileHeader, HwpFlags, LicenseFlags } from "../types/FileHeader.js";
import { ORIGINAL_HWP_SIGNATURE } from "../constants/fileSignature.js";
import { HwpRecord } from "../types/HwpRecord.js";
import type { HwpDocInfo } from "../types/HwpDocInfo.js";
import { inflateSync } from "fflate";
import { parseHwpDocInfo } from "./HwpDocInfoParser.js";

export class HwpDocument {
  container: CFB$Container;
  fileHeader: FileHeader;
  docInfo: HwpDocInfo;

  private constructor(
    container: CFB$Container,
    fileHeader: FileHeader,
    docInfo: HwpDocInfo,
  ) {
    this.container = container;
    this.fileHeader = fileHeader;
    this.docInfo = docInfo;
  }

  static open(buf: ArrayBuffer): HwpDocument {
    const container = parse(new Uint8Array(buf), { raw: true });
    const headerEntry = find(container, "FileHeader");
    if (!headerEntry) throw new Error("FileHeader 스트림을 찾을 수 없습니다.");

    const header = Uint8Array.from(headerEntry.content);
    if (header.byteLength < 46)
      throw new Error("HWP FileHeader 가 너무 짧습니다.");

    const fileHeader = HwpDocument.parseFileHeader(header);

    const docInfoEntry = find(container, "DocInfo");
    if (!docInfoEntry) throw new Error("DocInfo 스트림을 찾을 수 없습니다.");
    const storedDocInfo = Uint8Array.from(docInfoEntry.content);
    const docInfoBytes = fileHeader.flags.isCompressed
      ? inflateSync(storedDocInfo)
      : storedDocInfo;

    const hwpRecords = parseRecord(docInfoBytes);
    const docInfo = parseHwpDocInfo(hwpRecords);
    // console.log(docInfo);

    return new HwpDocument(container, fileHeader, docInfo);
  }

  private static parseFileHeader(content: Uint8Array): FileHeader {
    const siguatureBytes = new TextEncoder().encode(ORIGINAL_HWP_SIGNATURE);

    const signature = new TextDecoder().decode(
      content.subarray(0, siguatureBytes.length),
    );

    if (signature !== ORIGINAL_HWP_SIGNATURE)
      throw new Error("올바른 HWP 파일이 아닙니다.");

    const version = content.subarray(32, 36);
    const flags = content.subarray(36, 40);
    const license = content.subarray(40, 44);
    const flagBits = new DataView(
      flags.buffer,
      flags.byteOffset,
      flags.byteLength,
    ).getUint32(0, true);
    const licenseBits = new DataView(
      license.buffer,
      license.byteOffset,
      license.byteLength,
    ).getUint32(0, true);

    const hasBit = (value: number, bit: number) => (value & (1 << bit)) !== 0;

    const hwpFlags: HwpFlags = {
      isCompressed: hasBit(flagBits, 0),
      isPasswordProtected: hasBit(flagBits, 1),
      isDistributionalDocument: hasBit(flagBits, 2),
      hasScripts: hasBit(flagBits, 3),
      isDrm: hasBit(flagBits, 4),
      hasXmlTemplate: hasBit(flagBits, 5),
      hasDocumentHistory: hasBit(flagBits, 6),
      hasSignature: hasBit(flagBits, 7),
      isCertificateEncrypted: hasBit(flagBits, 8),
      isSignatureReserved: hasBit(flagBits, 9),
      isCertificateDrm: hasBit(flagBits, 10),
      isCcl: hasBit(flagBits, 11),
      isMobileOptimized: hasBit(flagBits, 12),
      isPrivacyProtected: hasBit(flagBits, 13),
      hasTrackChanges: hasBit(flagBits, 14),
      isKogl: hasBit(flagBits, 15),
      hasVideoControl: hasBit(flagBits, 16),
      hasTableOfContentsField: hasBit(flagBits, 17),
    };

    const licenseFlags: LicenseFlags = {
      hasLicenseInfo: hasBit(licenseBits, 0),
      isCopyRestricted: hasBit(licenseBits, 1),
      isShareAlike: hasBit(licenseBits, 2),
    };

    const fileHeader: FileHeader = {
      signature,
      version: {
        MM: version[3],
        nn: version[2],
        PP: version[1],
        rr: version[0],
      },
      flags: hwpFlags,
      license: licenseFlags,
      encryptVersion: content[44],
      koglCountry: content[45],
    };

    return fileHeader;
  }
}

/**
 * 스트림을 받아 레코드 배열을 반환하는 함수
 */
function parseRecord(bytes: Uint8Array): HwpRecord[] {
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
