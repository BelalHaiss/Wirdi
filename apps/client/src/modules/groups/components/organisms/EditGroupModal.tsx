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
import type { GroupDto, UpdateGroupDto } from '@wirdi/shared';
import { AwradField, STATUS_OPTIONS } from './group-form-shared';

type EditGroupModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: GroupDto;
  isLoading: boolean;
  onSubmit: (data: UpdateGroupDto) => Promise<void>;
};

export function EditGroupModal({
  open,
  onOpenChange,
  group,
  isLoading,
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
      timezone: group.timezone,
      status: group.status,
      description: group.description ?? '',
      awrad: group.awrad,
    },
  });

  const awrad = watch('awrad') ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>تعديل معلومات الحلقة</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
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
