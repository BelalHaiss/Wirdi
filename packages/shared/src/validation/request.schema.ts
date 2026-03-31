import { z, type ZodType } from 'zod';
import type { ValidationLocale } from './messages';
import type { CreateRequestDto, ReviewRequestDto, RequestPayloadMap } from '../request.types';
import type { ISODateString } from '../types/api.types';

export const createExcuseRequestSchema = (locale: ValidationLocale = 'ar') =>
  z.object({
    type: z.literal('EXCUSE'),
    payload: z.object({
      groupId: z
        .string()
        .trim()
        .min(1, locale === 'ar' ? 'الرجاء اختيار المجموعة' : 'Please select a group'),
      expiresAt: z
        .string()
        .datetime({
          message: locale === 'ar' ? 'تاريخ انتهاء العذر غير صالح' : 'Invalid expiry date',
        })
        .refine(
          (date) => new Date(date) > new Date(),
          locale === 'ar'
            ? 'تاريخ انتهاء العذر يجب أن يكون في المستقبل'
            : 'Expiry date must be in the future'
        )
        .transform((v) => v as ISODateString),
      reason: z
        .string()
        .trim()
        .min(1, locale === 'ar' ? 'الرجاء كتابة سبب العذر' : 'Please enter a reason'),
    }) satisfies ZodType<RequestPayloadMap['EXCUSE']>,
  }) satisfies ZodType<CreateRequestDto<'EXCUSE'>>;

export const createActivationRequestSchema = (locale: ValidationLocale = 'ar') =>
  z.object({
    type: z.literal('ACTIVATION'),
    payload: z.object({
      groupId: z
        .string()
        .trim()
        .min(1, locale === 'ar' ? 'الرجاء اختيار المجموعة' : 'Please select a group'),
    }) satisfies ZodType<RequestPayloadMap['ACTIVATION']>,
  }) satisfies ZodType<CreateRequestDto<'ACTIVATION'>>;

export const reviewRequestSchema = (locale: ValidationLocale = 'ar') =>
  z.object({
    action: z.enum(['ACCEPT', 'REJECT'], {
      message: locale === 'ar' ? 'إجراء غير صالح' : 'Invalid action',
    }),
  }) satisfies ZodType<ReviewRequestDto>;
