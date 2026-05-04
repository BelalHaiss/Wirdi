import z, { ZodType } from 'zod';
import {
  AssignLearnersToGroupDto,
  AwradType,
  CreateAndAssignLearnersDto,
  CreateExcuseDto,
  CreateGroupDto,
  CreateWeekScheduleDto,
  GroupStatus,
  RecordLearnerWirdDto,
  UpdateGroupDto,
  UpdateMemberMateDto,
  UpdateScheduleImageDto,
  UpdateStudentWirdsDto,
} from '../group.types';
import { ISODateString } from '../types/api.types';
import { getMessages, ValidationLocale } from './messages';
import {
  descriptionSchema,
  isoDateOnlySchema,
  nameSchema,
  nonEmptyIdSchema,
  notesSchema,
  timeMinutesSchema,
  usernameAccountSchema,
} from './fields.schema';
import { timezoneSchema } from './timezone.schema';

const groupStatusSchema = z.enum(['ACTIVE', 'INACTIVE']) satisfies ZodType<GroupStatus>;
const awradTypesSchema = (locale: ValidationLocale) => {
  const m = getMessages(locale);
  return z.array(z.string().min(1)).min(1, m.awradMin) satisfies ZodType<AwradType[]>;
};

export const createGroupSchema = (locale: ValidationLocale = 'ar') =>
  z.object({
    name: nameSchema(locale),
    status: groupStatusSchema.optional(),
    description: descriptionSchema(locale).optional(),
    awrad: awradTypesSchema(locale),
    moderatorId: z.string().trim().optional(),
  }) satisfies ZodType<CreateGroupDto>;

export const updateGroupSchema = (locale: ValidationLocale = 'ar') => {
  const m = getMessages(locale);
  return z
    .object({
      name: nameSchema(locale).optional(),
      status: groupStatusSchema.optional(),
      description: descriptionSchema(locale).optional(),
      awrad: awradTypesSchema(locale).optional(),
      moderatorId: z.string().trim().optional(),
    })
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
          username: usernameAccountSchema(locale),
          timezone: timezoneSchema(locale),
          notes: notesSchema(locale).optional(),
          age: z.coerce.number().int().positive().optional(),
          platform: z.string().trim().optional(),
          schedule: timeMinutesSchema(locale).optional(),
          recitation: z.string().trim().optional(),
        })
      )
      .min(1, locale === 'ar' ? 'يجب إضافة متعلم واحد على الأقل' : 'At least one learner required'),
  }) satisfies ZodType<CreateAndAssignLearnersDto>;

export const updateMemberMateSchema = () =>
  z.object({
    mateId: z.string().trim().nullable(),
  }) satisfies ZodType<UpdateMemberMateDto>;

export const createExcuseSchema = (locale: ValidationLocale = 'ar') =>
  z.object({
    studentId: nonEmptyIdSchema(locale),
    groupId: nonEmptyIdSchema(locale),
    expiresAt: z
      .string()
      .datetime({
        message: locale === 'ar' ? 'تاريخ انتهاء الصلاحية غير صالح' : 'Invalid expiry date',
      })
      .transform((v) => v as ISODateString),
    requestId: z.string().trim().optional(),
  }) satisfies ZodType<CreateExcuseDto>;

export const updateStudentWirdsSchema = (locale: ValidationLocale = 'ar') =>
  z.object({
    updates: z
      .array(
        z.object({
          dayNumber: z.number().int().min(0).max(6),
          status: z.enum(['ATTENDED', 'MISSED']),
        })
      )
      .min(
        1,
        locale === 'ar' ? 'يجب تحديد يوم واحد على الأقل' : 'At least one day update required'
      ),
  }) satisfies ZodType<UpdateStudentWirdsDto>;

export const recordLearnerWirdSchema = (locale: ValidationLocale = 'ar') =>
  z.discriminatedUnion('readSource', [
    z.object({
      groupId: nonEmptyIdSchema(locale),
      weekId: nonEmptyIdSchema(locale),
      dayNumber: z.number().int().min(0).max(6),
      readSource: z.literal('DEFAULT_GROUP_MATE'),
      mateId: z.null(),
    }),
    z.object({
      groupId: nonEmptyIdSchema(locale),
      weekId: nonEmptyIdSchema(locale),
      dayNumber: z.number().int().min(0).max(6),
      readSource: z.literal('DIFFERENT_GROUP_MATE'),
      mateId: nonEmptyIdSchema(locale),
    }),
    z.object({
      groupId: nonEmptyIdSchema(locale),
      weekId: nonEmptyIdSchema(locale),
      dayNumber: z.number().int().min(0).max(6),
      readSource: z.literal('OUTSIDE_GROUP'),
      mateId: z.null().optional(),
    }),
  ]) satisfies ZodType<RecordLearnerWirdDto>;
