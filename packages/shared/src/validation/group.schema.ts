import z, { ZodType } from 'zod';
import {
  AssignLearnersToGroupDto,
  AwradType,
  CreateAndAssignLearnersDto,
  CreateGroupDto,
  CreateWeekScheduleDto,
  GroupStatus,
  UpdateGroupDto,
  UpdateMemberMateDto,
  UpdateScheduleImageDto,
} from '../group.types';
import { getMessages, ValidationLocale } from './messages';
import {
  descriptionSchema,
  isoDateOnlySchema,
  nameSchema,
  nonEmptyIdSchema,
  notesSchema,
} from './fields.schema';
import { optionalTimezoneFieldSchema, timezoneFieldSchema } from './timezone.schema';

const groupStatusSchema = z.enum(['ACTIVE', 'INACTIVE']) satisfies ZodType<GroupStatus>;
const awradTypesSchema = (locale: ValidationLocale) => {
  const m = getMessages(locale);
  return z.array(z.string().min(1)).min(1, m.awradMin) satisfies ZodType<AwradType[]>;
};

export const createGroupSchema = (locale: ValidationLocale = 'ar') =>
  z.intersection(
    z.object({
      name: nameSchema(locale),
      status: groupStatusSchema.optional(),
      description: descriptionSchema(locale).optional(),
      awrad: awradTypesSchema(locale),
      moderatorId: z.string().trim().optional(),
    }),
    timezoneFieldSchema(locale)
  ) satisfies ZodType<CreateGroupDto>;

export const updateGroupSchema = (locale: ValidationLocale = 'ar') => {
  const m = getMessages(locale);
  return z
    .intersection(
      z.object({
        name: nameSchema(locale).optional(),
        status: groupStatusSchema.optional(),
        description: descriptionSchema(locale).optional(),
        awrad: awradTypesSchema(locale).optional(),
        moderatorId: z.string().trim().optional(),
      }),
      optionalTimezoneFieldSchema(locale)
    )
    .refine((value) => Object.keys(value).length > 0, {
      message: m.atLeastOneField,
    }) satisfies ZodType<UpdateGroupDto>;
};

export const createWeekScheduleSchema = (locale: ValidationLocale = 'ar') => {
  return z.object({
    saturdayDate: isoDateOnlySchema(locale).optional(),
    scheduleName: z
      .string()
      .trim()
      .min(1, locale === 'ar' ? 'اسم الجدول مطلوب' : 'Schedule name is required'),
  }) satisfies ZodType<CreateWeekScheduleDto>;
};

export const updateScheduleImageSchema = () =>
  z.object({
    name: z.string().trim().min(1).optional(),
  }) satisfies ZodType<UpdateScheduleImageDto>;

export const assignLearnersToGroupSchema = (locale: ValidationLocale = 'ar') =>
  z.object({
    groupId: nonEmptyIdSchema(locale),
    studentIds: z
      .array(nonEmptyIdSchema(locale))
      .min(1, locale === 'ar' ? 'يجب تحديد متعلم واحد على الأقل' : 'At least one learner required'),
  }) satisfies ZodType<AssignLearnersToGroupDto>;

export const createAndAssignLearnersSchema = (locale: ValidationLocale = 'ar') =>
  z.object({
    groupId: nonEmptyIdSchema(locale),
    learners: z
      .array(
        z.object({
          name: nameSchema(locale),
          timezone: z.string().trim().min(1),
          notes: notesSchema(locale).optional(),
        })
      )
      .min(1, locale === 'ar' ? 'يجب إضافة متعلم واحد على الأقل' : 'At least one learner required'),
  }) satisfies ZodType<CreateAndAssignLearnersDto>;

export const updateMemberMateSchema = () =>
  z.object({
    mateId: z.string().trim().nullable(),
  }) satisfies ZodType<UpdateMemberMateDto>;
