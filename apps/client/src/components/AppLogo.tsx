import * as React from 'react';
import { cn } from '@/lib/utils';

type AppLogoProps = React.ComponentProps<'div'> & {
  size?: 'md' | 'lg';
};

const sizeClasses = {
  md: 'h-20',
  lg: 'h-32',
};

export function AppLogo({ className, size = 'md', ...props }: AppLogoProps) {
  return (
    <div className={cn('inline-flex items-center', className)} {...props}>
      <img
        src='/logo.png'
        alt='النبراس'
        className={cn('w-auto object-contain', sizeClasses[size])}
      />
    </div>
  );
}
