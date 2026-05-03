/**
 * Single source of truth for optional learner detail fields.
 * Used for:
 *  - DTO / type definitions (LearnerDetailsDto)
 *  - Excel column header → field key mapping (excelColumn)
 *  - UI label rendering (label)
 */

export interface LearnerDetailsDto {
  age?: string;
  country?: string;
  platform?: string;
  schedule?: string;
  recitation?: string;
}

export const LEARNER_DETAIL_FIELDS: {
  key: keyof LearnerDetailsDto;
  label: string;
  /** Canonical Arabic Excel column header (normalized form) */
  excelColumn: string;
}[] = [
  { key: 'age', label: 'السن', excelColumn: 'السن' },
  { key: 'country', label: 'البلد', excelColumn: 'البلد' },
  { key: 'platform', label: 'الوسيلة', excelColumn: 'الوسيلة' },
  { key: 'schedule', label: 'الموعد', excelColumn: 'الموعد' },
  { key: 'recitation', label: 'الرواية', excelColumn: 'الرواية' },
];
