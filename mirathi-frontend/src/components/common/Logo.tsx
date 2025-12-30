import * as React from 'react';
import { Link } from 'react-router-dom';
import logoImage from '../../assets/logo.png';

export interface LogoProps extends React.HTMLAttributes<HTMLAnchorElement> {
  /** Optional image size (default: h-10 w-10) */
  sizeClassName?: string;
  /** Optional variant to show the tagline */
  showTagline?: boolean;
}

/**
 * Logo component – displays the Mirathi brand identity.
 * 
 * Context:
 * Represents the entry point to the "Digital Succession Copilot".
 * The design prioritizes trust (Legal) and clarity (Economic Truth).
 */
export const Logo: React.FC<LogoProps> = ({
  className,
  sizeClassName = 'h-10 w-10',
  showTagline = false,
  ...props
}) => {
  return (
    <Link
      to="/"
      className={`flex items-center gap-3 ${className ?? ''}`}
      {...props}
      aria-label="Mirathi Home"
    >
      <img
        src={logoImage}
        alt="Mirathi - Digital Succession Copilot"
        loading="eager" // Load logo immediately as it's LCP (Largest Contentful Paint) critical
        decoding="async"
        className={`${sizeClassName} object-contain`} 
      />
      <div className="flex flex-col justify-center">
        <span className="font-serif text-2xl font-bold tracking-tight text-gray-900 dark:text-white leading-none">
          Mirathi
        </span>
        {showTagline && (
          <span className="text-[0.65rem] font-medium uppercase tracking-widest text-gray-500 mt-0.5">
            Succession Copilot
          </span>
        )}
      </div>
    </Link>
  );
};