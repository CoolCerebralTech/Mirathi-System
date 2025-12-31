"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { getInitials } from "../../lib/utils";

interface AvatarRootProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarRootProps>(
  ({ className, size = "md", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);

Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn("h-full w-full object-cover", className)}
    {...props}
  />
));

AvatarImage.displayName = "AvatarImage";

interface AvatarFallbackProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  name?: string;
}

const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  AvatarFallbackProps
>(({ className, name, children, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center font-medium text-muted-foreground",
      className
    )}
    {...props}
  >
    {children ?? (name ? getInitials(name) : "?")}
  </span>
));

AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
