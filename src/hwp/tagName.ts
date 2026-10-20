import * as tagIds from "../constants/tagId.js";

const tagNames = Object.fromEntries(
  Object.entries(tagIds)
    .filter(([name]) => name !== "HWPTAG_BEGIN")
    .map(([name, tagId]) => [tagId, name]),
) as Record<number, string>;

export function getTagName(tagId: number): string {
  return (
    tagNames[tagId] ??
    `UNKNOWN_TAG_0x${tagId.toString(16).padStart(3, "0").toUpperCase()}`
  );
}
