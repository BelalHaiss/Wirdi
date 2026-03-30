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
import { createGroupSchema } from '@wirdi/shared';
import type { CreateGroupDto, StaffUserDto } from '@wirdi/shared';
import { AwradField, ModeratorSelectField, STATUS_OPTIONS } from './group-form-shared';

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
      status: 'ACTIVE',
      description: '',
      awrad: [],
      moderatorId: 'none',
    },
  });

  const awrad = watch('awrad');
  const moderatorId = watch('moderatorId');

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
    reset();
  };

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
          <ModeratorSelectField
            value={moderatorId ?? 'none'}
            onChange={(v) => setValue('moderatorId', v, { shouldDirty: true })}
            staffUsers={staffUsers}
            errorMessage={errors.moderatorId?.message}
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
