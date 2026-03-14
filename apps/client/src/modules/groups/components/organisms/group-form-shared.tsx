import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { CreatableCombobox } from '@/components/ui/creatable-combobox';
import { TIMEZONES } from '@wirdi/shared';
import type { AwradType } from '@wirdi/shared';

export const AWRAD_SUGGESTIONS: AwradType[] = ['حفظ', 'مراجعة', 'تلاوة'];

export const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'نشط' },
  { value: 'INACTIVE', label: 'غير نشط' },
];

export const timezoneOptions = TIMEZONES.map((tz) => ({ value: tz.value, label: tz.label }));

// ─── AwradField ───────────────────────────────────────────────────────────────

type AwradFieldProps = {
  value: AwradType[];
  onChange: (value: AwradType[]) => void;
  errorMessage?: string;
};

export function AwradField({ value, onChange, errorMessage }: AwradFieldProps) {
  return (
    <Field>
      <FieldLabel>الأوراد</FieldLabel>
      <CreatableCombobox
        value={value}
        onChange={onChange}
        suggestions={AWRAD_SUGGESTIONS}
        createLabel={(v) => `إضافة "وِرد" جديد: ${v}`}
      />
      <FieldError errors={[{ message: errorMessage }]} />
    </Field>
  );
}
