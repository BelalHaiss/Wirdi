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
import { updateGroupSchema } from '@wirdi/shared';
import type { GroupDto, UpdateGroupDto, StaffUserDto } from '@wirdi/shared';
import { AwradField, ModeratorSelectField, STATUS_OPTIONS } from './group-form-shared';

type EditGroupModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: GroupDto;
  staffUsers: StaffUserDto[];
  isLoading: boolean;
  isLoadingStaff: boolean;
  onSubmit: (data: UpdateGroupDto) => Promise<void>;
};

export function EditGroupModal({
  open,
  onOpenChange,
  group,
  staffUsers,
  isLoading,
  isLoadingStaff,
  onSubmit,
}: EditGroupModalProps) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isDirty, errors },
  } = useForm<UpdateGroupDto>({
    resolver: zodResolver(updateGroupSchema('ar')),
    defaultValues: {
      name: group.name,
      status: group.status,
      description: group.description ?? '',
      awrad: group.awrad,
      moderatorId: group.moderatorId ?? 'none',
    },
  });

  const awrad = watch('awrad') ?? [];
  const moderatorId = watch('moderatorId');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>تعديل معلومات الحلقة</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((data) =>
            onSubmit({
              ...data,
              moderatorId:
                data.moderatorId && data.moderatorId !== 'none' ? data.moderatorId : undefined,
            })
          )}
          className='space-y-4'
        >
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
            disabled={isLoadingStaff}
          />

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              color='muted'
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type='submit' color='success' disabled={isLoading || !isDirty}>
              {isLoading ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
