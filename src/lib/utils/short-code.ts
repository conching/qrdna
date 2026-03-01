import { nanoid } from "nanoid";
import { SHORT_CODE_LENGTH } from "@/lib/constants";

export function generateShortCode(): string {
  return nanoid(SHORT_CODE_LENGTH);
}
