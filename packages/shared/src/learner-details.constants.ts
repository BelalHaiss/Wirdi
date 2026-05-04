/**
 * Single source of truth for optional learner detail fields.
 * Used for:
 *  - DTO / type definitions (LearnerDetailsDto)
 *  - Excel column header → field key mapping (excelColumn)
 *  - UI label rendering (label)
 */

// ─── Enum Types ─────────────────────────────────────────────────────────────

export type RecitationType = 'HAFS' | 'WARSH';

export type PlatformType = 'MOBILE_NETWORKS' | 'INTERNET' | 'BOTH';

// ─── Select Options (value = DB enum key, label = Arabic display) ────────────

export type EnumOption<T extends string> = { value: T; label: string };

export const RECITATION_OPTIONS: EnumOption<RecitationType>[] = [
  { value: 'HAFS', label: 'حفص' },
  { value: 'WARSH', label: 'ورش' },
];

export const PLATFORM_OPTIONS: EnumOption<PlatformType>[] = [
  { value: 'MOBILE_NETWORKS', label: 'عبر شبكات الجوال' },
  { value: 'INTERNET', label: 'عبر الانترنت' },
  { value: 'BOTH', label: 'كلاهما متاح' },
];

// ─── DTO ─────────────────────────────────────────────────────────────────────

export interface LearnerDetailsDto {
  age?: number;
  platform?: PlatformType;
  schedule?: number;
  recitation?: RecitationType;
}

// ─── Field Definitions ───────────────────────────────────────────────────────

export type LearnerDetailInputType = 'text' | 'time' | 'select';

export const LEARNER_DETAIL_FIELDS: {
  key: keyof LearnerDetailsDto;
  label: string;
  /** Canonical Arabic Excel column header (normalized form) */
  excelColumn: string;
  inputType: LearnerDetailInputType;
  options?: EnumOption<string>[];
}[] = [
  { key: 'age', label: 'السن', excelColumn: 'السن', inputType: 'text' },
  {
    key: 'platform',
    label: 'الوسيلة',
    excelColumn: 'الوسيلة',
    inputType: 'select',
    options: PLATFORM_OPTIONS,
  },
  { key: 'schedule', label: 'الموعد', excelColumn: 'الموعد', inputType: 'time' },
  {
    key: 'recitation',
    label: 'الرواية',
    excelColumn: 'الرواية',
    inputType: 'select',
    options: RECITATION_OPTIONS,
  },
];
