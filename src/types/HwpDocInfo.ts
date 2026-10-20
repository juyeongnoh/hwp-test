import type { HwpRecord } from "./HwpRecord.js";

export interface HwpDocInfo {
  documentProperties: HwpTagDocumentProperties;
  idMappings: HwpTagIdMappings;
  binData: HwpTagBinData[];
  faceNames: HwpTagFaceName[];
  borderFills: HwpTagBorderFill[];
  charShapes: HwpTagCharShape[];
  tabDefs: HwpTagTabDef[];
  numberings: HwpTagNumbering[];
  bullets: HwpTagBullet[];
  paraShapes: HwpTagParaShape[];
  styles: HwpTagStyle[];
  docData: HwpTagDocData[];
  distributeDocData: HwpTagDistributeDocData[];
  reserved13: HwpTagReserved13[];
  compatibleDocuments: HwpTagCompatibleDocument[];
  layoutCompatibilities: HwpTagLayoutCompatibility[];
  trackchanges: HwpTagTrackchange[];
  memoShapes: HwpTagMemoShape[];
  forbiddenChars: HwpTagForbiddenChar[];
  trackChanges: HwpTagTrackChange[];
  trackChangeAuthors: HwpTagTrackChangeAuthor[];
  unknownRecords: HwpRecord[];
}

export interface HwpTagDocumentProperties {
  /** 구역 개수 (2바이트) */
  sectionCount: number;
  /** 페이지 시작 번호 (2바이트) */
  pageNumberStart: number;
  /** 각주 시작 번호 (2바이트) */
  footnoteNumberStart: number;
  /** 미주 시작 번호 (2바이트) */
  endnoteNumberStart: number;
  /** 그림 시작 번호 (2바이트) */
  pictureNumberStart: number;
  /** 표 시작 번호 (2바이트) */
  tableNumberStart: number;
  /** 수식 시작 번호 (2바이트) */
  equationNumberStart: number;
  /** 리스트 아이디 (2바이트) */
  caretListId: number;
  /** 문단 아이디 (2바이트) */
  caretParagraphId: number;
  /** 문단 내에서의 글자 단위 위치 (2바이트) */
  caretCharacterPosition: number;
}

export interface HwpTagIdMappings {
  counts: {
    binData: number;
    hangulFonts: number;
    englishFonts: number;
    hanjaFonts: number;
    japaneseFonts: number;
    otherFonts: number;
    symbolFonts: number;
    userFonts: number;
    borderFills: number;
    charShapes: number;
    tabDefs: number;
    numberings: number;
    bullets: number;
    paraShapes: number;
    styles: number;
    memoShapes?: number;
    trackChanges?: number;
    trackChangeAuthors?: number;
  };
  additionalCounts: number[];
}

export interface HwpTagBinData {
  attributes: number;
  type: "link" | "embedding" | "storage";
  compression: "default" | "compressed" | "uncompressed";
  accessState: number;
  absolutePath?: string;
  relativePath?: string;
  storageId?: number;
  extension?: string;
}

export interface HwpTagFaceName {
  properties: number;
  faceName: string;
  substituteFontType?: number;
  substituteFaceName?: string;
  fontTypeInfo?: {
    family: number;
    serifStyle: number;
    weight: number;
    proportion: number;
    contrast: number;
    strokeVariation: number;
    armStyle: number;
    letterform: number;
    midline: number;
    xHeight: number;
  };
  baseFaceName?: string;
}

export interface HwpTagBorderFill {
  properties: number;
  borders: {
    left: HwpBorder;
    right: HwpBorder;
    top: HwpBorder;
    bottom: HwpBorder;
    diagonal: HwpBorder;
  };
  fill: HwpFillInfo;
}

export interface HwpBorder {
  type: number;
  width: number;
  color: number;
}

export interface HwpFillInfo {
  type: number;
  solid?: {
    backgroundColor: number;
    patternColor: number;
    patternType: number;
    alpha?: number;
  };
  gradient?: {
    kind: number;
    angle: number;
    centerX: number;
    centerY: number;
    blur: number;
    colors: number[];
    positions?: number[];
    blurCenter?: number;
    alpha?: number;
  };
  image?: {
    type: number;
    brightness: number;
    contrast: number;
    effect: number;
    binDataId: number;
  };
  additionalProperties: Uint8Array;
  extensionData?: Uint8Array;
}

export interface HwpTagCharShape {
  fontIds: number[];
  ratios: number[];
  spacings: number[];
  relativeSizes: number[];
  offsets: number[];
  baseSize: number;
  attributes: number;
  shadowOffsets: number[];
  textColor: number;
  underlineColor: number;
  shadingColor: number;
  shadowColor: number;
  borderFillId?: number;
  strikeoutColor?: number;
  extensionData?: Uint8Array;
}

export interface HwpTagTabDef {
  attributes: number;
  tabs: Array<{ position: number; type: number; fill: number }>;
}

export interface HwpTagNumbering {
  paragraphHeads: Array<{
    attributes: number;
    widthCorrection: number;
    distance: number;
    charShapeId: number;
  }>;
  formats: string[];
  startNumber: number;
  levelStartNumbers?: number[];
  extendedParagraphHeads?: Array<{
    attributes: number;
    widthCorrection: number;
    distance: number;
    charShapeId: number;
  }>;
  extendedFormats?: string[];
  extendedStartNumbers?: number[];
}

export interface HwpTagBullet {
  attributes: number;
  widthCorrection: number;
  distance: number;
  bulletCharacter: string;
  imageBulletId: number;
  imageBullet: {
    contrast: number;
    brightness: number;
    effect: number;
    binDataId: number;
  };
  checkBulletCharacter: string;
}

export interface HwpTagParaShape {
  attributes1: number;
  leftMargin: number;
  rightMargin: number;
  indent: number;
  spaceBefore: number;
  spaceAfter: number;
  legacyLineSpacing: number;
  tabDefId: number;
  numberingOrBulletId: number;
  borderFillId: number;
  borderSpacing: { left: number; right: number; top: number; bottom: number };
  attributes2?: number;
  attributes3?: number;
  lineSpacing?: number;
  extensionData?: Uint8Array;
}

export interface HwpTagStyle {
  localName: string;
  englishName: string;
  attributes: number;
  nextStyleId: number;
  languageId: number;
  paragraphShapeId: number;
  charShapeId: number;
  extensionData?: Uint8Array;
}

export interface HwpTagDocData {
  parameterSets: HwpParameterSet[];
}

export interface HwpParameterSet {
  id: number;
  items: HwpParameterItem[];
}

export interface HwpParameterItem {
  id: number;
  type: number;
  value: unknown;
}

export interface HwpTagDistributeDocData {
  bytes: Uint8Array;
}
export interface HwpTagCompatibleDocument {
  targetProgram: number;
}
export interface HwpTagLayoutCompatibility {
  characterFormat: number;
  paragraphFormat: number;
  sectionFormat: number;
  objectFormat: number;
  fieldFormat: number;
}

/** 공개 명세에 payload 필드 구조가 정의되지 않은 태그의 원본 payload. */
export interface HwpTagRawRecord extends HwpRecord {}
export interface HwpTagReserved13 extends HwpTagRawRecord {}
export interface HwpTagTrackchange extends HwpTagRawRecord {}
export interface HwpTagMemoShape {
  memoType: number;
  lineWidth: number;
  lineColor: number;
  fillColor: number;
  activeColor: number;
  memoListCount: number;
}
export interface HwpTagForbiddenChar {
  groups: [string, string, string, string];
  extensionData?: Uint8Array;
}
export interface HwpTagTrackChange extends HwpTagRawRecord {}
export interface HwpTagTrackChangeAuthor extends HwpTagRawRecord {}
