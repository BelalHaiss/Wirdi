import {
  CreateLearnerDto,
  nameSchema,
  notesSchema,
  timezoneFieldSchema,
  usernameAccountSchema,
  TIME_MINUTES_MAX,
} from '@wirdi/shared';
import { z, type ZodType } from 'zod';

export type StudentMainInfoFormValues = Pick<CreateLearnerDto, 'name' | 'username' | 'timezone'> & {
  notes: string;
  details: {
    age: string;
    platform: string;
    schedule?: number;
    recitation: string;
  };
};

export const studentMainInfoFormSchema = z.intersection(
  z.object({
    name: nameSchema(),
    username: usernameAccountSchema(),
    notes: notesSchema(),
    details: z.object({
      age: z.string().trim(),
      platform: z.string().trim(),
      schedule: z.coerce.number().int().min(0).max(TIME_MINUTES_MAX).optional(),
      recitation: z.string().trim(),
    }),
  }),
  timezoneFieldSchema()
) satisfies ZodType<StudentMainInfoFormValues>;
