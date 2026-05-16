import { Loader2, Send, UserCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { GroupSelectField } from '../molecules/GroupSelectField';
import { useActivationRequestViewModel } from '../../viewmodels/create-activation-request.viewmodel';

type ActivationRequestModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultGroupId?: string;
  hideGroupSelect?: boolean;
};

export function ActivationRequestModal({
  open,
  onOpenChange,
  defaultGroupId,
  hideGroupSelect = false,
}: ActivationRequestModalProps) {
  const vm = useActivationRequestViewModel(open, defaultGroupId);

  const handleSubmit = () => {
    vm.handleSubmit();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg' dir='rtl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-right'>
            <UserCheck className='h-5 w-5 text-primary' />
            طلب تفعيل
          </DialogTitle>
        </DialogHeader>

        <div className='flex flex-col gap-4'>
          {vm.isLoading ? (
            <div className='flex justify-center py-6'>
              <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
          ) : vm.groups.length === 0 ? (
            <Typography size='sm' className='text-center py-6 text-muted-foreground'>
              لا توجد مجموعات غير نشطة
            </Typography>
          ) : (
            <>
              {!hideGroupSelect && (
                <GroupSelectField
                  value={vm.selectedGroupId}
                  onChange={vm.setSelectedGroupId}
                  groups={vm.groups}
                  label='اختر المجموعة'
                  placeholder='اختر المجموعة'
                />
              )}

              <div className='flex gap-2 justify-end pt-2'>
                <Button
                  variant='outline'
                  color='muted'
                  onClick={() => onOpenChange(false)}
                  disabled={vm.isSubmitting}
                >
                  إلغاء
                </Button>
                <Button
                  color='success'
                  onClick={handleSubmit}
                  disabled={!vm.selectedGroupId || vm.isSubmitting}
                >
                  {vm.isSubmitting ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Send className='h-4 w-4' />
                  )}
                  إرسال الطلب
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
