export interface FileHeader {
  signature: string;
  version: DocumentVersion;
  flags: HwpFlags;
  license: LicenseFlags;
  /** 0: None, 1: 한글 2.5 버전 이하, 2: 한글 3.0 버전 Enhanced, 3: 한글 3.0 버전 Old, 4: 한글 7.0 버전 이후 */
  encryptVersion: number;
  /** KOGL 라이선스 문서의 국가 코드: 6 = 한국, 15 = 그 외. */
  koglCountry: number;
}
export interface HwpFlags {
  /** bit 0: 압축 여부(bit 레코드 스트림이 raw DEFLATE로 압축돼 있다.) */
  isCompressed: boolean;
  /** bit 1: 암호 설정 여부 */
  isPasswordProtected: boolean;
  /** bit 2: 배포용 문서 여부(본문이 `ViewText/`에 있고 암호화돼 있다.) */
  isDistributionalDocument: boolean;
  /** bit 3: 스크립트 저장 여부 */
  hasScripts: boolean;
  /** bit 4: DRM 보안 문서 여부 */
  isDrm: boolean;
  /** bit 5: XMLTemplate 스토리지 존재 여부 */
  hasXmlTemplate: boolean;
  /** bit 6: 문서 이력 관리 존재 여부 */
  hasDocumentHistory: boolean;
  /** bit 7: 전자 서명 정보 존재 여부 */
  hasSignature: boolean;
  /** bit 8: 공인 인증서 암호화 여부 */
  isCertificateEncrypted: boolean;
  /** bit 9: 전자 서명 예비 저장 여부 */
  isSignatureReserved: boolean;
  /** bit 10: 공인 인증서 DRM 보안 분서 여부 */
  isCertificateDrm: boolean;
  /** bit 11: CCL 문서 여부 */
  isCcl: boolean;
  /** bit 12: 모바일 최적화 여부 */
  isMobileOptimized: boolean;
  /** bit 13: 개인 정보 보안 문서 여부 */
  isPrivacyProtected: boolean;
  /** bit 14: 변경 추적 문서 여부 */
  hasTrackChanges: boolean;
  /** bit 15: 공공누리(KOGL) 저작권 문서 */
  isKogl: boolean;
  /** bit 16: 비디오 컨트롤 포함 여부 */
  hasVideoControl: boolean;
  /** bit 17: 차례 필드 컨트롤 포함 여부 */
  hasTableOfContentsField: boolean;
}

/** 속성 2 — 오프셋 40의 라이선스 비트필드. */
export interface LicenseFlags {
  /** bit 0: CCL, 공공누리 라이선스 정보 */
  hasLicenseInfo: boolean;
  /** bit 1: 복제 제한 여부 */
  isCopyRestricted: boolean;
  /** 동일 조건 하에 복제 허용. 제한이 걸려 있으면 무시된다. */
  isShareAlike: boolean;
}

export interface DocumentVersion {
  /** Major */
  MM: number;
  /** Minor */
  nn: number;
  /** Build */
  PP: number;
  /** Revision */
  rr: number;
}
