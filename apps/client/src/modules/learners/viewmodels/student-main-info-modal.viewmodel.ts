import { useState, useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DEFAULT_TIMEZONE } from '@wirdi/shared';
import type { CreateLearnerDto, LearnerDto, UpdateLearnerDto } from '@wirdi/shared';
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

  const handleFormSubmit = (values: StudentMainInfoFormValues) => {
    if (isViewMode || !onSubmit) {
      onClose();
      return;
    }

    const submitData: StudentMainInfoSubmitArgs = isCreateMode
      ? {
          mode: 'create',
          addToGroupId,
          data: {
            name: values.name.trim(),
            username: values.username.trim(),
            timezone: values.timezone,
            contact: values.notes.trim() ? { notes: values.notes.trim() } : undefined,
          },
        }
      : {
          mode: 'edit',
          learnerId: learner?.id,
          data: {
            name: values.name.trim(),
            username: values.username.trim(),
            timezone: values.timezone,
            contact: { notes: values.notes.trim() || undefined },
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
