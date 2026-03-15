import { UserCheck, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Typography } from '@/components/ui/typography';
import { Separator } from '@/components/ui/separator';
import { useAssignExistingLearnersViewModel } from '../../viewmodels/assign-existing-learners.viewmodel';

type Props = {
  groupId: string;
  isActive: boolean;
  onSuccess: () => void;
};

export function AssignExistingLearnersTab({ groupId, isActive, onSuccess }: Props) {
  const vm = useAssignExistingLearnersViewModel(groupId, isActive);

  const handleAssign = async () => {
    await vm.handleAssign();
    onSuccess();
  };

  return (
    <div className='space-y-3'>
      <div className='relative'>
        <Search className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
        <Input
          placeholder='بحث عن متعلم...'
          value={vm.search}
          onChange={(e) => vm.setSearch(e.target.value)}
          className='pr-9'
        />
      </div>

      {vm.isLoading ? (
        <div className='flex items-center justify-center h-40 text-muted-foreground'>
          <Typography size='sm'>جاري التحميل...</Typography>
        </div>
      ) : vm.filtered.length === 0 ? (
        <div className='flex items-center justify-center h-40 text-muted-foreground'>
          <Typography size='sm'>لا يوجد متعلمون غير منتسبين</Typography>
        </div>
      ) : (
        <>
          <div className='flex items-center justify-between px-1'>
            <Typography size='sm' className='text-muted-foreground'>
              {vm.selected.size > 0
                ? `تم تحديد ${vm.selected.size}`
                : `${vm.filtered.length} متعلم`}
            </Typography>
            <Button type='button' variant='ghost' size='sm' onClick={vm.toggleAll}>
              {vm.selected.size === vm.filtered.length ? 'إلغاء الكل' : 'تحديد الكل'}
            </Button>
          </div>

          <Separator />

          <div className='space-y-1 max-h-56 overflow-y-auto pr-1'>
            {vm.filtered.map((learner) => (
              <button
                key={learner.id}
                type='button'
                onClick={() => vm.toggleSelect(learner.id)}
                className='flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-right hover:bg-muted/50 transition-colors'
              >
                <Checkbox
                  checked={vm.selected.has(learner.id)}
                  onCheckedChange={() => vm.toggleSelect(learner.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className='flex-1 min-w-0'>
                  <Typography size='sm' className='font-medium truncate'>
                    {learner.name}
                  </Typography>
                  <Typography size='xs' className='text-muted-foreground'>
                    {learner.timezone}
                  </Typography>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <Button
        type='button'
        color='success'
        className='w-full gap-1.5'
        disabled={vm.selected.size === 0 || vm.isAssigning}
        onClick={handleAssign}
      >
        <UserCheck className='h-4 w-4' />
        {vm.isAssigning ? 'جاري الإضافة...' : `إضافة ${vm.selected.size || ''} متعلم`.trim()}
      </Button>
    </div>
  );
}
