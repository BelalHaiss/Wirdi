import { useState, useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DEFAULT_TIMEZONE, LEARNER_DETAIL_FIELDS } from '@wirdi/shared';
import type {
  CreateLearnerDto,
  LearnerDetailsDto,
  LearnerDto,
  UpdateLearnerDto,
} from '@wirdi/shared';
import {
  studentMainInfoFormSchema,
  type StudentMainInfoFormValues,
} from '../utils/learner.validation';

export type StudentMainInfoMode = 'view' | 'edit' | 'create';

export type StudentMainInfoLearner = Pick<
  LearnerDto,
  'id' | 'name' | 'username' | 'timezone' | 'contact' | 'groupCount' | 'groups'
>;

export type StudentMainInfoSubmitArgs =
  | { mode: 'create'; addToGroupId?: string; data: CreateLearnerDto }
  | { mode: 'edit'; learnerId?: string; data: UpdateLearnerDto };

type UseStudentMainInfoModalArgs = {
  mode: StudentMainInfoMode;
  learner?: StudentMainInfoLearner | null;
  addToGroupId?: string;
  onSubmit?: (args: StudentMainInfoSubmitArgs) => Promise<void> | void;
  onClose: () => void;
};

export function useStudentMainInfoModal({
  mode,
  learner,
  addToGroupId,
  onSubmit,
  onClose,
}: UseStudentMainInfoModalArgs) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingSubmitArgs, setPendingSubmitArgs] = useState<StudentMainInfoSubmitArgs | null>(
    null
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isViewMode = mode === 'view';
  const isCreateMode = mode === 'create';

  const defaultValues = useMemo<StudentMainInfoFormValues>(
    () => ({
      name: learner && !isCreateMode ? learner.name : '',
      username: learner && !isCreateMode ? (learner.username ?? '') : '',
      timezone: learner && !isCreateMode ? learner.timezone || DEFAULT_TIMEZONE : DEFAULT_TIMEZONE,
      notes: learner && !isCreateMode ? learner.contact.notes || '' : '',
      details: {
        age: (!isCreateMode && learner?.contact.details?.age) || '',
        country: (!isCreateMode && learner?.contact.details?.country) || '',
        platform: (!isCreateMode && learner?.contact.details?.platform) || '',
        schedule: (!isCreateMode && learner?.contact.details?.schedule) || '',
        recitation: (!isCreateMode && learner?.contact.details?.recitation) || '',
      },
    }),
    [learner, isCreateMode]
  );

  const form = useForm<StudentMainInfoFormValues>({
    resolver: zodResolver(
      studentMainInfoFormSchema
    ) as unknown as Resolver<StudentMainInfoFormValues>,
    values: defaultValues,
    mode: 'onTouched',
  });

  const buildDetails = (d: StudentMainInfoFormValues['details']): LearnerDetailsDto | undefined => {
    const result = Object.fromEntries(
      LEARNER_DETAIL_FIELDS.map(({ key }) => [key, d[key].trim()]).filter(([, val]) => val !== '')
    ) as LearnerDetailsDto;
    return Object.keys(result).length > 0 ? result : undefined;
  };

  const handleFormSubmit = (values: StudentMainInfoFormValues) => {
    if (isViewMode || !onSubmit) {
      onClose();
      return;
    }

    const notes = values.notes.trim() || undefined;
    const details = buildDetails(values.details);

    const submitData: StudentMainInfoSubmitArgs = isCreateMode
      ? {
          mode: 'create',
          addToGroupId,
          data: {
            name: values.name.trim(),
            username: values.username.trim(),
            timezone: values.timezone,
            contact: notes || details ? { notes, details } : undefined,
          },
        }
      : {
          mode: 'edit',
          learnerId: learner?.id,
          data: {
            name: values.name.trim(),
            username: values.username.trim(),
            timezone: values.timezone,
            contact: { notes, details },
          },
        };

    setPendingSubmitArgs(submitData);
    setConfirmOpen(true);
  };

  const confirmSubmit = async () => {
    if (!pendingSubmitArgs || !onSubmit) return;

    setErrorMessage(null);
    try {
      await onSubmit(pendingSubmitArgs);
      setConfirmOpen(false);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'تعذر حفظ بيانات الطالب');
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setErrorMessage(null);
      setConfirmOpen(false);
      setPendingSubmitArgs(null);
      onClose();
    }
  };

  return {
    form,
    isViewMode,
    isCreateMode,
    errorMessage,
    confirmOpen,
    setConfirmOpen,
    handleFormSubmit: form.handleSubmit(handleFormSubmit),
    confirmSubmit,
    handleOpenChange,
  };
}
