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
import { FormField } from '@/components/forms/form-field';
import { TIMEZONES } from '@wirdi/shared';
import type { CreateAndAssignLearnersDto } from '@wirdi/shared';
import { AssignExistingLearnersTab } from './AssignExistingLearnersTab';
import { useAddGroupLearnersModal } from '../../viewmodels/add-group-learners-modal.viewmodel';

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
  const vm = useAddGroupLearnersModal({
    groupId,
    onSubmit,
    onClose: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={vm.handleClose}>
      <DialogContent className='min-w-3/4 max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>إضافة متعلمين للحلقة</DialogTitle>
        </DialogHeader>

        <Tabs value={vm.tab} onValueChange={(v) => vm.setTab(v as 'new' | 'existing')}>
          <TabsList className='w-full'>
            <TabsTrigger value='new' className='flex-1'>
              متعلمون جدد
            </TabsTrigger>
            <TabsTrigger value='existing' className='flex-1'>
              متعلمون موجودون
            </TabsTrigger>
          </TabsList>

          <TabsContent value='new' className='mt-4 space-y-4'>
            <form onSubmit={vm.handleSubmit} className='space-y-4'>
              <div className='space-y-3'>
                {vm.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className='flex flex-row flex-wrap gap-2 items-baseline border rounded-xl p-3 bg-muted/20'
                  >
                    <div className='flex-1 min-w-32'>
                      <FormField
                        control={vm.control}
                        name={`learners.${index}.name`}
                        label='الاسم'
                        type='text'
                        placeholder='اسم المتعلم'
                      />
                    </div>
                    <div className='flex-1 min-w-32'>
                      <FormField
                        control={vm.control}
                        name={`learners.${index}.username`}
                        label='اسم المستخدم'
                        type='text'
                        placeholder='لتسجيل الدخول'
                      />
                    </div>
                    <div className='flex-1 min-w-36'>
                      <FormField
                        control={vm.control}
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
                    {vm.fields.length > 1 && (
                      <Button
                        type='button'
                        variant='ghost'
                        color='danger'
                        size='icon'
                        className='self-center'
                        onClick={() => vm.removeLearner(index)}
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
                onClick={vm.addLearner}
              >
                <Plus className='h-3.5 w-3.5' />
                إضافة متعلم آخر
              </Button>

              <DialogFooter>
                <Button type='button' variant='outline' color='muted' onClick={vm.handleClose}>
                  إلغاء
                </Button>
                <Button type='submit' color='success' disabled={isLoading} className='gap-1.5'>
                  <UserPlus className='h-4 w-4' />
                  {isLoading ? 'جاري الإضافة...' : `إضافة ${vm.learnersCount} متعلم`}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value='existing' className='mt-4'>
            <AssignExistingLearnersTab
              groupId={groupId}
              isActive={vm.tab === 'existing'}
              onSuccess={vm.handleClose}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
