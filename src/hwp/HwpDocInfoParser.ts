import {
  HWPTAG_BIN_DATA,
  HWPTAG_BORDER_FILL,
  HWPTAG_BULLET,
  HWPTAG_CHAR_SHAPE,
  HWPTAG_COMPATIBLE_DOCUMENT,
  HWPTAG_DISTRIBUTE_DOC_DATA,
  HWPTAG_DOC_DATA,
  HWPTAG_DOCUMENT_PROPERTIES,
  HWPTAG_FACE_NAME,
  HWPTAG_FORBIDDEN_CHAR,
  HWPTAG_ID_MAPPINGS,
  HWPTAG_LAYOUT_COMPATIBILITY,
  HWPTAG_MEMO_SHAPE,
  HWPTAG_NUMBERING,
  HWPTAG_PARA_SHAPE,
  HWPTAG_RESERVED_13,
  HWPTAG_STYLE,
  HWPTAG_TAB_DEF,
  HWPTAG_TRACKCHANGE,
  HWPTAG_TRACK_CHANGE,
  HWPTAG_TRACK_CHANGE_AUTHOR,
} from "../constants/tagId.js";
import type {
  HwpDocInfo,
  HwpParameterItem,
  HwpParameterSet,
  HwpTagBinData,
  HwpTagBorderFill,
  HwpTagBullet,
  HwpTagCharShape,
  HwpTagCompatibleDocument,
  HwpTagDistributeDocData,
  HwpTagDocData,
  HwpTagDocumentProperties,
  HwpTagFaceName,
  HwpTagForbiddenChar,
  HwpTagIdMappings,
  HwpTagLayoutCompatibility,
  HwpTagMemoShape,
  HwpTagNumbering,
  HwpTagParaShape,
  HwpTagRawRecord,
  HwpTagReserved13,
  HwpTagStyle,
  HwpTagTabDef,
  HwpTagTrackChange,
  HwpTagTrackChangeAuthor,
  HwpTagTrackchange,
} from "../types/HwpDocInfo.js";
import type { HwpRecord } from "../types/HwpRecord.js";

class PayloadReader {
  private readonly view: DataView;
  offset = 0;

  constructor(
    private readonly bytes: Uint8Array,
    private readonly tagName: string,
  ) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  get remaining(): number {
    return this.bytes.byteLength - this.offset;
  }

  private require(length: number): void {
    if (
      !Number.isInteger(length) ||
      length < 0 ||
      this.offset + length > this.bytes.byteLength
    ) {
      throw new Error(
        `${this.tagName} 레코드 데이터가 잘렸습니다. offset=${this.offset}, length=${length}`,
      );
    }
  }

  u8(): number {
    this.require(1);
    return this.view.getUint8(this.offset++);
  }
  i8(): number {
    this.require(1);
    return this.view.getInt8(this.offset++);
  }
  u16(): number {
    this.require(2);
    const v = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return v;
  }
  i16(): number {
    this.require(2);
    const v = this.view.getInt16(this.offset, true);
    this.offset += 2;
    return v;
  }
  u32(): number {
    this.require(4);
    const v = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return v;
  }
  i32(): number {
    this.require(4);
    const v = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return v;
  }
  raw(length: number): Uint8Array {
    this.require(length);
    const v = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return v;
  }
  utf16(length: number): string {
    return new TextDecoder("utf-16le").decode(this.raw(length * 2));
  }

  assertDone(): void {
    if (this.remaining !== 0) {
      throw new Error(
        `${this.tagName} 레코드에 해석되지 않은 바이트가 남았습니다: ${this.remaining}바이트`,
      );
    }
  }
}

function reader(record: HwpRecord, name: string): PayloadReader {
  if (record.size !== record.data.byteLength) {
    throw new Error(`${name} 레코드 헤더 길이와 실제 데이터 길이가 다릅니다.`);
  }
  return new PayloadReader(record.data, name);
}

export function parseHwpDocInfo(records: HwpRecord[]): HwpDocInfo {
  let documentProperties: HwpTagDocumentProperties | undefined;
  let idMappings: HwpTagIdMappings | undefined;
  const result: Omit<HwpDocInfo, "documentProperties" | "idMappings"> = {
    binData: [],
    faceNames: [],
    borderFills: [],
    charShapes: [],
    tabDefs: [],
    numberings: [],
    bullets: [],
    paraShapes: [],
    styles: [],
    docData: [],
    distributeDocData: [],
    reserved13: [],
    compatibleDocuments: [],
    layoutCompatibilities: [],
    trackchanges: [],
    memoShapes: [],
    forbiddenChars: [],
    trackChanges: [],
    trackChangeAuthors: [],
    unknownRecords: [],
  };

  for (const record of records) {
    switch (record.tagId) {
      case HWPTAG_DOCUMENT_PROPERTIES:
        if (documentProperties)
          throw new Error("문서 속성 레코드가 중복되었습니다.");
        documentProperties = parseDocumentProperties(record);
        break;
      case HWPTAG_ID_MAPPINGS:
        if (idMappings) throw new Error("아이디 매핑 레코드가 중복되었습니다.");
        idMappings = parseIdMappings(record);
        break;
      case HWPTAG_BIN_DATA:
        result.binData.push(parseBinData(record));
        break;
      case HWPTAG_FACE_NAME:
        result.faceNames.push(parseFaceName(record));
        break;
      case HWPTAG_BORDER_FILL:
        result.borderFills.push(parseBorderFill(record));
        break;
      case HWPTAG_CHAR_SHAPE:
        result.charShapes.push(parseCharShape(record));
        break;
      case HWPTAG_TAB_DEF:
        result.tabDefs.push(parseTabDef(record));
        break;
      case HWPTAG_NUMBERING:
        result.numberings.push(parseNumbering(record));
        break;
      case HWPTAG_BULLET:
        result.bullets.push(parseBullet(record));
        break;
      case HWPTAG_PARA_SHAPE:
        result.paraShapes.push(parseParaShape(record));
        break;
      case HWPTAG_STYLE:
        result.styles.push(parseStyle(record));
        break;
      case HWPTAG_DOC_DATA:
        result.docData.push(parseDocData(record));
        break;
      case HWPTAG_DISTRIBUTE_DOC_DATA:
        result.distributeDocData.push(parseDistributeDocData(record));
        break;
      case HWPTAG_RESERVED_13:
        result.reserved13.push(parseOpaque(record, "예약 태그"));
        break;
      case HWPTAG_COMPATIBLE_DOCUMENT:
        result.compatibleDocuments.push(parseCompatibleDocument(record));
        break;
      case HWPTAG_LAYOUT_COMPATIBILITY:
        result.layoutCompatibilities.push(parseLayoutCompatibility(record));
        break;
      case HWPTAG_TRACKCHANGE:
        result.trackchanges.push(parseOpaque(record, "변경 추적 정보", 1032));
        break;
      case HWPTAG_MEMO_SHAPE:
        result.memoShapes.push(parseMemoShape(record));
        break;
      case HWPTAG_FORBIDDEN_CHAR:
        result.forbiddenChars.push(parseForbiddenChar(record));
        break;
      case HWPTAG_TRACK_CHANGE:
        result.trackChanges.push(parseOpaque(record, "변경 추적 내용"));
        break;
      case HWPTAG_TRACK_CHANGE_AUTHOR:
        result.trackChangeAuthors.push(parseOpaque(record, "변경 추적 작성자"));
        break;
      default:
        reader(record, `알 수 없는 태그 0x${record.tagId.toString(16)}`);
        result.unknownRecords.push({
          ...record,
          data: record.data.slice(),
        });
    }
  }

  if (!documentProperties)
    throw new Error("문서 속성 레코드를 찾을 수 없습니다.");
  if (!idMappings) throw new Error("아이디 매핑 레코드를 찾을 수 없습니다.");
  return { ...result, documentProperties, idMappings };
}

function parseDocumentProperties(record: HwpRecord): HwpTagDocumentProperties {
  const r = reader(record, "문서 속성");
  if (r.remaining !== 26)
    throw new Error(`문서 속성 길이는 26바이트여야 합니다: ${r.remaining}`);
  const value = {
    sectionCount: r.u16(),
    pageNumberStart: r.u16(),
    footnoteNumberStart: r.u16(),
    endnoteNumberStart: r.u16(),
    pictureNumberStart: r.u16(),
    tableNumberStart: r.u16(),
    equationNumberStart: r.u16(),
    caretListId: r.u32(),
    caretParagraphId: r.u32(),
    caretCharacterPosition: r.u32(),
  };
  r.assertDone();
  return value;
}

function parseIdMappings(record: HwpRecord): HwpTagIdMappings {
  const r = reader(record, "아이디 매핑");
  if (r.remaining < 60 || r.remaining % 4 !== 0) {
    throw new Error(`아이디 매핑 길이가 잘못되었습니다: ${r.remaining}`);
  }
  const raw: number[] = [];
  while (r.remaining) raw.push(r.u32());
  const names = [
    "binData",
    "hangulFonts",
    "englishFonts",
    "hanjaFonts",
    "japaneseFonts",
    "otherFonts",
    "symbolFonts",
    "userFonts",
    "borderFills",
    "charShapes",
    "tabDefs",
    "numberings",
    "bullets",
    "paraShapes",
    "styles",
    "memoShapes",
    "trackChanges",
    "trackChangeAuthors",
  ] as const;
  const counts = Object.fromEntries(
    names.slice(0, raw.length).map((name, index) => [name, raw[index]]),
  ) as HwpTagIdMappings["counts"];
  return { counts, additionalCounts: raw.slice(names.length) };
}

function parseBinData(record: HwpRecord): HwpTagBinData {
  const r = reader(record, "바이너리 데이터");
  const attributes = r.u16();
  const typeValue = attributes & 0x0f;
  const type =
    typeValue === 0
      ? "link"
      : typeValue === 1
        ? "embedding"
        : typeValue === 2
          ? "storage"
          : undefined;
  if (!type) throw new Error(`알 수 없는 BinData type입니다: ${typeValue}`);
  const compressionValue = attributes & 0x30;
  const compression =
    compressionValue === 0x10
      ? "compressed"
      : compressionValue === 0x20
        ? "uncompressed"
        : "default";
  const value: HwpTagBinData = {
    attributes,
    type,
    compression,
    accessState: (attributes >>> 8) & 3,
  };
  if (type === "link") {
    value.absolutePath = r.utf16(r.u16());
    value.relativePath = r.utf16(r.u16());
  } else {
    value.storageId = r.u16();
    if (type === "embedding") value.extension = r.utf16(r.u16());
  }
  r.assertDone();
  return value;
}

function parseFaceName(record: HwpRecord): HwpTagFaceName {
  const r = reader(record, "글꼴");
  const properties = r.u8();
  const value: HwpTagFaceName = { properties, faceName: r.utf16(r.u16()) };
  if (properties & 0x80) {
    value.substituteFontType = r.u8();
    value.substituteFaceName = r.utf16(r.u16());
  }
  if (properties & 0x40) {
    const info = r.raw(10);
    value.fontTypeInfo = {
      family: info[0],
      serifStyle: info[1],
      weight: info[2],
      proportion: info[3],
      contrast: info[4],
      strokeVariation: info[5],
      armStyle: info[6],
      letterform: info[7],
      midline: info[8],
      xHeight: info[9],
    };
  }
  if (properties & 0x20) value.baseFaceName = r.utf16(r.u16());
  r.assertDone();
  return value;
}

function parseBorderFill(record: HwpRecord): HwpTagBorderFill {
  const r = reader(record, "테두리/배경");
  const properties = r.u16();
  // HWP stores each edge as one 6-byte tuple: type, width, color.
  const borders = Array.from({ length: 5 }, () => ({
    type: r.u8(),
    width: r.u8(),
    color: r.u32(),
  }));
  const fillType = r.u32();
  const fill: HwpTagBorderFill["fill"] = {
    type: fillType,
    additionalProperties: new Uint8Array(),
  };

  if (fillType & 1) {
    fill.solid = {
      backgroundColor: r.u32(),
      patternColor: r.u32(),
      patternType: r.i32(),
    };
  }
  if (fillType & 4) {
    const kind = r.i16();
    const angle = r.i16();
    const centerX = r.i16();
    const centerY = r.i16();
    const blur = r.i16();
    const count = r.i16();
    if (count < 0) throw new Error("그러데이션 색상 개수가 음수입니다.");
    const positions =
      count > 2 ? Array.from({ length: count }, () => r.i32()) : undefined;
    const colors = Array.from({ length: count }, () => r.u32());
    fill.gradient = {
      kind,
      angle,
      centerX,
      centerY,
      blur,
      colors,
      ...(positions ? { positions } : {}),
    };
  }
  if (fillType & 2) {
    const type = r.u8();
    const brightness = r.i8();
    const contrast = r.i8();
    const effect = r.u8();
    const binDataId = r.u16();
    fill.image = { type, brightness, contrast, effect, binDataId };
  }

  // Revision 1.3 omits the alpha byte found in real solid-fill records.
  // Keep it when present, then consume the length-prefixed extra payload.
  if (fillType & 4) {
    if (r.remaining >= 4) {
      const gradientExtraLength = r.u32();
      const gradientExtra = r.raw(gradientExtraLength);
      if (gradientExtra.byteLength > 0 && fill.gradient) {
        fill.gradient.blurCenter = gradientExtra[0];
        if (gradientExtra.byteLength > 1)
          fill.extensionData = gradientExtra.subarray(1).slice();
      }
    }
    if (r.remaining === 1 && fill.gradient) {
      fill.gradient.alpha = r.u8();
    } else if (r.remaining >= 5 && fill.gradient) {
      fill.gradient.alpha = r.u8();
      const additionalLength = r.u32();
      fill.additionalProperties = r.raw(additionalLength);
    } else if (r.remaining >= 4) {
      const additionalLength = r.u32();
      fill.additionalProperties = r.raw(additionalLength);
    }
  } else if (fillType & 1) {
    if (r.remaining >= 5 && fill.solid) fill.solid.alpha = r.u8();
    if (r.remaining >= 4) {
      const additionalLength = r.u32();
      fill.additionalProperties = r.raw(additionalLength);
    }
  } else if (r.remaining >= 4) {
    const additionalLength = r.u32();
    fill.additionalProperties = r.raw(additionalLength);
  }
  if (r.remaining) fill.extensionData = r.raw(r.remaining).slice();
  r.assertDone();
  return {
    properties,
    borders: {
      left: borders[0],
      right: borders[1],
      top: borders[2],
      bottom: borders[3],
      diagonal: borders[4],
    },
    fill,
  };
}

function parseCharShape(record: HwpRecord): HwpTagCharShape {
  const r = reader(record, "글자 모양");
  if (r.remaining < 68)
    throw new Error(`글자 모양 길이가 너무 짧습니다: ${r.remaining}`);
  const fontIds = Array.from({ length: 7 }, () => r.u16());
  const ratios = Array.from({ length: 7 }, () => r.u8());
  const spacings = Array.from({ length: 7 }, () => r.i8());
  const relativeSizes = Array.from({ length: 7 }, () => r.u8());
  const offsets = Array.from({ length: 7 }, () => r.i8());
  const baseSize = r.i32();
  const attributes = r.u32();
  const shadowOffsets = [r.i8(), r.i8()];
  const textColor = r.u32();
  const underlineColor = r.u32();
  const shadingColor = r.u32();
  const shadowColor = r.u32();
  const value: HwpTagCharShape = {
    fontIds,
    ratios,
    spacings,
    relativeSizes,
    offsets,
    baseSize,
    attributes,
    shadowOffsets,
    textColor,
    underlineColor,
    shadingColor,
    shadowColor,
  };
  if (r.remaining >= 2) value.borderFillId = r.u16();
  if (r.remaining >= 4) value.strikeoutColor = r.u32();
  if (r.remaining) value.extensionData = r.raw(r.remaining);
  return value;
}

function parseTabDef(record: HwpRecord): HwpTagTabDef {
  const r = reader(record, "탭 정의");
  const attributes = r.u32();
  const count = r.u32();
  if (r.remaining !== count * 8) {
    throw new Error(
      `탭 정의 count와 레코드 길이가 일치하지 않습니다: count=${count}, remaining=${r.remaining}`,
    );
  }
  const tabs = Array.from({ length: count }, () => {
    const position = r.i32();
    const type = r.u8();
    const fill = r.u8();
    r.u16();
    return { position, type, fill };
  });
  r.assertDone();
  return { attributes, tabs };
}

function parseNumbering(record: HwpRecord): HwpTagNumbering {
  const r = reader(record, "문단 번호");
  const readParagraphHead = () => ({
    attributes: r.u32(),
    widthCorrection: r.u16(),
    distance: r.u16(),
    charShapeId: r.u32(),
  });

  const paragraphHeads = [];
  const formats = [];
  for (let level = 0; level < 7; level++) {
    paragraphHeads.push(readParagraphHead());
    formats.push(r.utf16(r.u16()));
  }

  const startNumber = r.u16();
  const value: HwpTagNumbering = { paragraphHeads, formats, startNumber };
  if (r.remaining >= 7 * 4)
    value.levelStartNumbers = Array.from({ length: 7 }, () => r.u32());
  if (r.remaining) {
    value.extendedParagraphHeads = [];
    value.extendedFormats = [];
    for (let level = 0; level < 3; level++) {
      value.extendedParagraphHeads.push(readParagraphHead());
      value.extendedFormats.push(r.utf16(r.u16()));
    }
  }
  if (r.remaining >= 3 * 4)
    value.extendedStartNumbers = Array.from({ length: 3 }, () => r.u32());
  r.assertDone();
  return value;
}

function parseBullet(record: HwpRecord): HwpTagBullet {
  const r = reader(record, "글머리표");
  const attributes = r.u32();
  const widthCorrection = r.u16();
  const distance = r.u16();
  const bulletCharacter = r.utf16(1);
  const imageBulletId = r.i32();
  const contrast = r.i8();
  const brightness = r.i8();
  const effect = r.u8();
  const binDataId = r.u8();
  const checkBulletCharacter = r.utf16(1);
  r.assertDone();
  return {
    attributes,
    widthCorrection,
    distance,
    bulletCharacter,
    imageBulletId,
    imageBullet: { contrast, brightness, effect, binDataId },
    checkBulletCharacter,
  };
}

function parseParaShape(record: HwpRecord): HwpTagParaShape {
  const r = reader(record, "문단 모양");
  if (r.remaining < 42)
    throw new Error(`문단 모양 길이가 너무 짧습니다: ${r.remaining}`);
  const value: HwpTagParaShape = {
    attributes1: r.u32(),
    leftMargin: r.i32(),
    rightMargin: r.i32(),
    indent: r.i32(),
    spaceBefore: r.i32(),
    spaceAfter: r.i32(),
    legacyLineSpacing: r.i32(),
    tabDefId: r.u16(),
    numberingOrBulletId: r.u16(),
    borderFillId: r.u16(),
    borderSpacing: {
      left: r.i16(),
      right: r.i16(),
      top: r.i16(),
      bottom: r.i16(),
    },
  };
  if (r.remaining >= 4) value.attributes2 = r.u32();
  if (r.remaining >= 4) value.attributes3 = r.u32();
  if (r.remaining >= 4) value.lineSpacing = r.u32();
  if (r.remaining) value.extensionData = r.raw(r.remaining).slice();
  return value;
}

function parseMemoShape(record: HwpRecord): HwpTagMemoShape {
  const r = reader(record, "메모 모양");
  if (r.remaining !== 22)
    throw new Error(`메모 모양 길이는 22바이트여야 합니다: ${r.remaining}`);
  const value = {
    memoType: r.u16(),
    lineWidth: r.u32(),
    lineColor: r.u32(),
    fillColor: r.u32(),
    activeColor: r.u32(),
    memoListCount: r.u32(),
  };
  r.assertDone();
  return value;
}

function parseForbiddenChar(record: HwpRecord): HwpTagForbiddenChar {
  const r = reader(record, "금칙 문자");
  const lengths = Array.from({ length: 4 }, () => r.u32());
  const groups = lengths.map((length) =>
    r.utf16(length),
  ) as HwpTagForbiddenChar["groups"];
  const value: HwpTagForbiddenChar = { groups };
  if (r.remaining) value.extensionData = r.raw(r.remaining).slice();
  return value;
}

function parseStyle(record: HwpRecord): HwpTagStyle {
  const r = reader(record, "스타일");
  const localName = r.utf16(r.u16());
  const englishName = r.utf16(r.u16());
  const attributes = r.u8();
  const nextStyleId = r.u8();
  const languageId = r.i16();
  const paragraphShapeId = r.u16();
  const charShapeId = r.u16();
  const value: HwpTagStyle = {
    localName,
    englishName,
    attributes,
    nextStyleId,
    languageId,
    paragraphShapeId,
    charShapeId,
  };
  if (r.remaining) value.extensionData = r.raw(r.remaining).slice();
  return value;
}

function parseDocData(record: HwpRecord): HwpTagDocData {
  const r = reader(record, "문서 임의 데이터");
  const parameterSets: HwpParameterSet[] = [];
  while (r.remaining) parameterSets.push(parseParameterSet(r));
  return { parameterSets };
}

function parseParameterSet(r: PayloadReader): HwpParameterSet {
  const id = r.u16();
  const count = r.i16();
  if (count < 0) throw new Error("파라미터 아이템 개수가 음수입니다.");
  const items: HwpParameterItem[] = Array.from({ length: count }, () => {
    const itemId = r.u16();
    const type = r.u16();
    return { id: itemId, type, value: parseParameterValue(r, type) };
  });
  return { id, items };
}

function parseParameterValue(r: PayloadReader, type: number): unknown {
  switch (type) {
    case 0:
      return null;
    case 1:
      return r.utf16(r.u16());
    case 2:
      return r.i8();
    case 3:
      return r.i16();
    case 4:
      return r.i32();
    case 5:
      return r.i32();
    case 6:
      return r.u8();
    case 7:
      return r.u16();
    case 8:
      return r.u32();
    case 9:
      return r.u32();
    case 0x8000:
      return parseParameterSet(r);
    case 0x8001:
      return Array.from({ length: r.i16() }, () => parseParameterSet(r));
    case 0x8002:
      return { binDataId: r.u16() };
    default:
      throw new Error(
        `지원하지 않는 문서 임의 데이터 파라미터 타입입니다: 0x${type.toString(16)}`,
      );
  }
}

function parseDistributeDocData(record: HwpRecord): HwpTagDistributeDocData {
  const r = reader(record, "배포용 문서 데이터");
  if (r.remaining !== 256)
    throw new Error(`배포용 문서 데이터 길이가 256이 아닙니다: ${r.remaining}`);
  return { bytes: r.raw(256) };
}

function parseCompatibleDocument(record: HwpRecord): HwpTagCompatibleDocument {
  const r = reader(record, "호환 문서");
  const targetProgram = r.u32();
  r.assertDone();
  return { targetProgram };
}

function parseLayoutCompatibility(
  record: HwpRecord,
): HwpTagLayoutCompatibility {
  const r = reader(record, "레이아웃 호환성");
  const value = {
    characterFormat: r.u32(),
    paragraphFormat: r.u32(),
    sectionFormat: r.u32(),
    objectFormat: r.u32(),
    fieldFormat: r.u32(),
  };
  r.assertDone();
  return value;
}

function parseOpaque(
  record: HwpRecord,
  name: string,
  expectedLength?: number,
): HwpTagRawRecord {
  reader(record, name);
  if (
    expectedLength !== undefined &&
    record.data.byteLength !== expectedLength
  ) {
    throw new Error(
      `${name} 레코드 길이가 ${expectedLength}바이트여야 합니다: ${record.data.byteLength}`,
    );
  }
  return { ...record, data: record.data.slice() };
}
