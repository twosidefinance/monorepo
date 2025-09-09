import { Translations } from "@/types/global";
import { translation as chineseTranslation } from "./languages/chinese";
import { translation as englishTranslation } from "./languages/english";
import { translation as frenchTranslation } from "./languages/french";
import { translation as hindiTranslation } from "./languages/hindi";
import { translation as japaneseTranslation } from "./languages/japanese";
import { translation as koreanTranslation } from "./languages/korean";
import { translation as portugueseTranslation } from "./languages/portuguese";
import { translation as russianTranslation } from "./languages/russian";
import { translation as spanishTranslation } from "./languages/spanish";
import { translation as vietnameseTranslation } from "./languages/vietnamese";

export const translations: Translations = {
  chinese: chineseTranslation,
  english: englishTranslation,
  french: frenchTranslation,
  hindi: hindiTranslation,
  japanese: japaneseTranslation,
  korean: koreanTranslation,
  portuguese: portugueseTranslation,
  russian: russianTranslation,
  spanish: spanishTranslation,
  vietnamese: vietnameseTranslation,
};
