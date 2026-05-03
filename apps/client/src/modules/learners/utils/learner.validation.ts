import {
  CreateLearnerDto,
  LearnerDetailsDto,
  nameSchema,
  notesSchema,
  timezoneFieldSchema,
  usernameAccountSchema,
} from '@wirdi/shared';
import { z, type ZodType } from 'zod';

export type StudentMainInfoFormValues = Pick<CreateLearnerDto, 'name' | 'username' | 'timezone'> & {
  notes: string;
  details: { [K in keyof Required<LearnerDetailsDto>]: string };
};

export const studentMainInfoFormSchema = z.intersection(
  z.object({
    name: nameSchema(),
    username: usernameAccountSchema(),
    notes: notesSchema(),
    details: z.object({
      age: z.string().trim(),
      country: z.string().trim(),
      platform: z.string().trim(),
      schedule: z.string().trim(),
      recitation: z.string().trim(),
    }),
  }),
  timezoneFieldSchema()
) satisfies ZodType<StudentMainInfoFormValues>;
