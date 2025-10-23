import * as React from 'react';
import { Link } from 'react-router-dom';
import logoImage from '../../assets/logo.png';

export interface LogoProps extends React.HTMLAttributes<HTMLAnchorElement> {
  /** Optional image size (default: h-10 w-10) */
  sizeClassName?: string;
}

/**
 * Logo component – displays brand logo and name.
 * Fully typed, production-ready, and compatible with Tailwind and react-router.
 */
export const Logo: React.FC<LogoProps> = ({
  className,
  sizeClassName = 'h-10 w-10',
  ...props
}) => {
  return (
    <Link
      to="/"
      className={`flex items-center space-x-2 ${className ?? ''}`}
      {...props}
    >
      <img
        src={logoImage}
        alt="Shamba Sure Logo"
        loading="lazy"
        decoding="async"
        className={`${sizeClassName} rounded-full object-cover`}
      />
      <span className="font-serif text-2xl font-bold text-primary-text">
        Shamba Sure
      </span>
    </Link>
  );
};
