// FILE: src/components/layout/PublicFooter.tsx

import { Link } from 'react-router-dom';

export function PublicFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <p className="text-center text-sm leading-loose text-muted-foreground">
          &copy; {currentYear} Shamba Sure. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/privacy-policy" className="hover:text-foreground">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-foreground">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}