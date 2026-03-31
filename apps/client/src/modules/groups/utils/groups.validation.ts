import { z } from 'zod';
import { createWeekScheduleSchema } from '@wirdi/shared';

export const attendanceFormSchema = z.record(z.string(), z.boolean().optional());
export type AttendanceFormValues = z.infer<typeof attendanceFormSchema>;

export const uploadFormSchema = (locale: 'ar' | 'en' = 'ar') =>
  createWeekScheduleSchema(locale).extend({
    file: z.custom<File>((val) => val instanceof File, {
      message: locale === 'ar' ? 'صورة الجدول مطلوبة' : 'Schedule image is required',
    }),
  });

/** Raw form field values (pre-transform) — use as TFieldValues in useForm */
export type UploadFormInput = z.input<ReturnType<typeof uploadFormSchema>>;
/** Validated output (post-transform, branded types) — use as TTransformedValues */
export type UploadFormValues = z.output<ReturnType<typeof uploadFormSchema>>;
