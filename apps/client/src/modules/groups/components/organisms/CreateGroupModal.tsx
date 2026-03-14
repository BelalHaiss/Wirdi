import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms/form-field';
import { createGroupSchema, DEFAULT_TIMEZONE } from '@wirdi/shared';
import type { CreateGroupDto, StaffUserDto } from '@wirdi/shared';
import { AwradField, STATUS_OPTIONS, timezoneOptions } from './group-form-shared';

type CreateGroupModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffUsers: StaffUserDto[];
  isLoading: boolean;
  onSubmit: (data: CreateGroupDto) => Promise<void>;
};

export function CreateGroupModal({
  open,
  onOpenChange,
  staffUsers,
  isLoading,
  onSubmit,
}: CreateGroupModalProps) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateGroupDto>({
    resolver: zodResolver(createGroupSchema('ar')),
    defaultValues: {
      name: '',
      timezone: DEFAULT_TIMEZONE,
      status: 'ACTIVE',
      description: '',
      awrad: [],
      moderatorId: '',
    },
  });

  const awrad = watch('awrad');

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleFormSubmit = async (data: CreateGroupDto) => {
    await onSubmit({
      ...data,
      moderatorId: data.moderatorId && data.moderatorId !== 'none' ? data.moderatorId : undefined,
      description: data.description?.trim() || undefined,
    });
  };

  const moderatorOptions = [
    { value: 'none', label: 'بدون مشرف' },
    ...staffUsers.map((u) => ({ value: u.id, label: u.name })),
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>إنشاء حلقة جديدة</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-4'>
          <FormField control={control} name='name' label='اسم الحلقة' type='text' />
          <FormField
            control={control}
            name='timezone'
            label='المنطقة الزمنية'
            type='select'
            options={timezoneOptions}
          />
          <FormField
            control={control}
            name='status'
            label='الحالة'
            type='select'
            options={STATUS_OPTIONS}
          />
          <FormField control={control} name='description' label='الوصف' type='textarea' rows={3} />
          <AwradField
            value={awrad}
            onChange={(v) => setValue('awrad', v, { shouldDirty: true })}
            errorMessage={errors.awrad?.message}
          />
          <FormField
            control={control}
            name='moderatorId'
            label='المشرف'
            type='select'
            options={moderatorOptions}
          />

          <DialogFooter>
            <Button type='button' variant='outline' color='muted' onClick={handleClose}>
              إلغاء
            </Button>
            <Button type='submit' color='success' disabled={isLoading}>
              {isLoading ? 'جاري الإنشاء...' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
