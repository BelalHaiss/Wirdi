import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotificationsViewModel } from '../hooks/useNotificationsViewModel';
import { NotificationDialog } from './NotificationDialog';

interface NotificationBellProps {
  isAuthenticated: boolean;
}

export function NotificationBell({ isAuthenticated }: NotificationBellProps) {
  const vm = useNotificationsViewModel(isAuthenticated);

  return (
    <>
      <Button
        variant='ghost'
        color='muted'
        size='icon'
        className='relative group'
        onClick={vm.handleOpen}
        aria-label='الإشعارات'
      >
        <Bell className='w-4 h-4 transition-transform group-hover:scale-110' />
        {vm.unreadCount > 0 && (
          <span className='absolute -top-0.5 -left-0.5 flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-danger text-danger-foreground text-[10px] font-bold leading-none shadow-sm animate-in zoom-in-50 duration-300'>
            {vm.unreadCount > 99 ? '99+' : vm.unreadCount}
          </span>
        )}
      </Button>

      <NotificationDialog
        open={vm.isOpen}
        onOpenChange={(open) => (open ? vm.handleOpen() : vm.handleClose())}
        notifications={vm.notifications}
        isLoading={vm.isLoading}
        hasMore={vm.hasMore}
        isLoadingMore={vm.isLoadingMore}
        onLoadMore={vm.loadMore}
      />
    </>
  );
}
