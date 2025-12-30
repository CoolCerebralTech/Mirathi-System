// FILE: src/components/common/Avatar.tsx

import * as React from 'react';
import { cn } from '../../lib/utils';
import { getInitials } from '../../lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ src, alt, fallback, size = 'md', className }: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-lg',
  };

  const showFallback = !src || imageError;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-full bg-muted',
        sizeClasses[size],
        className
      )}
    >
      {showFallback ? (
        <span className="font-medium text-muted-foreground">
          {fallback ? getInitials(fallback) : '?'}
        </span>
      ) : (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}
