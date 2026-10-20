import { CFB$Container, find, parse } from "cfb";
import { FileHeader, HwpFlags, LicenseFlags } from "../types/FileHeader.js";
import { ORIGINAL_HWP_SIGNATURE } from "../constants/fileSignature.js";
import type { HwpDocInfo } from "../types/HwpDocInfo.js";
import { inflateSync } from "fflate";
import { parseHwpDocInfo } from "./HwpDocInfoParser.js";
import { parseHwpRecord } from "./hwp-record.js";

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
    // CFB 라이브러리는 CFB$Blob (Uint8Array | number[])를 인자로 받는다.
    const container = parse(new Uint8Array(buf), { raw: true });

    const headerEntry = find(container, "FileHeader");
    if (!headerEntry) throw new Error("FileHeader 스트림을 찾을 수 없습니다.");
    const docInfoEntry = find(container, "DocInfo");
    if (!docInfoEntry) throw new Error("DocInfo 스트림을 찾을 수 없습니다.");

    // FileHeader 파싱
    const headerBytes = Uint8Array.from(headerEntry.content);
    if (headerBytes.byteLength < 46)
      throw new Error("HWP FileHeader 가 너무 짧습니다.");
    const fileHeader = HwpDocument.parseFileHeader(headerBytes);

    // DocInfo 파싱
    const storedDocInfo = Uint8Array.from(docInfoEntry.content);
    const docInfoBytes = fileHeader.flags.isCompressed
      ? inflateSync(storedDocInfo)
      : storedDocInfo;

    const hwpRecords = parseHwpRecord(docInfoBytes);
    const docInfo = parseHwpDocInfo(hwpRecords);

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
