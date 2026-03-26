import {
  CreateLearnerDto,
  nameSchema,
  notesSchema,
  timezoneFieldSchema,
  usernameAccountSchema,
} from '@wirdi/shared';
import { z, type ZodType } from 'zod';

export type StudentMainInfoFormValues = Pick<CreateLearnerDto, 'name' | 'username' | 'timezone'> & {
  notes: string;
};

export const studentMainInfoFormSchema = z.intersection(
  z.object({
    name: nameSchema(),
    username: usernameAccountSchema(),
    notes: notesSchema(),
  }),
  timezoneFieldSchema()
) satisfies ZodType<StudentMainInfoFormValues>;
