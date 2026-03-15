import { useState } from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { Typography } from '@/components/ui/typography';
import { createAndAssignLearnersSchema, DEFAULT_TIMEZONE, TIMEZONES } from '@wirdi/shared';
import type { CreateAndAssignLearnersDto } from '@wirdi/shared';
import { FormField } from '@/components/forms/form-field';
import { AssignExistingLearnersTab } from './AssignExistingLearnersTab';

type FormValues = Pick<CreateAndAssignLearnersDto, 'learners'>;

type AddGroupLearnersModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  onSubmit: (dto: CreateAndAssignLearnersDto) => Promise<void>;
  isLoading: boolean;
};

export function AddGroupLearnersModal({
  open,
  onOpenChange,
  groupId,
  onSubmit,
  isLoading,
}: AddGroupLearnersModalProps) {
  const [tab, setTab] = useState<'new' | 'existing'>('new');

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(createAndAssignLearnersSchema('ar').omit({ groupId: true })),
    defaultValues: { learners: [{ name: '', timezone: DEFAULT_TIMEZONE, notes: '' }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'learners' });

  const handleClose = () => {
    reset();
    setTab('new');
    onOpenChange(false);
  };

  const submit = async (values: FormValues) => {
    await onSubmit({
      groupId,
      learners: values.learners.map((l) => ({
        name: l.name,
        timezone: l.timezone,
        notes: l.notes || undefined,
      })),
    });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='min-w-3/4 max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>إضافة متعلمين للحلقة</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'new' | 'existing')}>
          <TabsList className='w-full'>
            <TabsTrigger value='new' className='flex-1'>
              متعلمون جدد
            </TabsTrigger>
            <TabsTrigger value='existing' className='flex-1'>
              متعلمون موجودون
            </TabsTrigger>
          </TabsList>

          <TabsContent value='new' className='mt-4 space-y-4'>
            <form onSubmit={handleSubmit(submit)} className='space-y-4'>
              <div className='space-y-3'>
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className='flex gap-2 items-end border rounded-xl p-3 bg-muted/20'
                  >
                    <div className='flex gap-2 w-full'>
                      <div className='flex-2'>
                        <Field>
                          <FieldLabel>الاسم</FieldLabel>
                          <Controller
                            control={control}
                            name={`learners.${index}.name`}
                            render={({ field: f, fieldState }) => (
                              <>
                                <Input
                                  {...f}
                                  placeholder='اسم المتعلم'
                                  aria-invalid={!!fieldState.error}
                                />
                                {fieldState.error && (
                                  <Typography size='xs' className='text-danger'>
                                    {fieldState.error.message}
                                  </Typography>
                                )}
                              </>
                            )}
                          />
                        </Field>
                      </div>
                      <div className='flex-1'>
                        <FormField
                          control={control}
                          name={`learners.${index}.timezone`}
                          id={`student-timezone-${index}`}
                          label='المنطقة الزمنية'
                          type='select'
                          placeholder='اختر المنطقة الزمنية'
                          options={TIMEZONES.map((tz) => ({
                            value: tz.value,
                            label: tz.label,
                          }))}
                        />
                      </div>
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type='button'
                        variant='ghost'
                        color='danger'
                        size='icon'
                        className='mb-0.5'
                        onClick={() => remove(index)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                type='button'
                variant='outline'
                size='sm'
                className='gap-1.5 w-full'
                onClick={() => append({ name: '', timezone: DEFAULT_TIMEZONE, notes: '' })}
              >
                <Plus className='h-3.5 w-3.5' />
                إضافة متعلم آخر
              </Button>

              <DialogFooter>
                <Button type='button' variant='outline' color='muted' onClick={handleClose}>
                  إلغاء
                </Button>
                <Button type='submit' color='success' disabled={isLoading} className='gap-1.5'>
                  <UserPlus className='h-4 w-4' />
                  {isLoading ? 'جاري الإضافة...' : `إضافة ${fields.length} متعلم`}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value='existing' className='mt-4'>
            <AssignExistingLearnersTab
              groupId={groupId}
              isActive={tab === 'existing'}
              onSuccess={handleClose}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
