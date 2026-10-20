import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { HwpDocument } from "../hwp/HwpDocument.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ORIGINAL_HWP_SIGNATURE } from "../constants/fileSignature.js";

const { dirname } = import.meta;

describe("HWP 파일 검증", () => {
  test("유효한 HWP 파일은 시그니처를 읽는다", () => {
    const buf = readFileSync(join(dirname, "../fixtures/sample.hwp"));
    const hwpDocument = HwpDocument.open(buf.buffer);
    assert.equal(hwpDocument.fileHeader.signature, ORIGINAL_HWP_SIGNATURE);
  });
});
