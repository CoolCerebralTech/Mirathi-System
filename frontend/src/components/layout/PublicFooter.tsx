// FILE: src/components/layouts/PublicFooter.tsx

import { Link } from 'react-router-dom';

export function PublicFooter() {
    return (
        <footer className="border-t">
            <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
                <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                    <p className="text-center text-sm leading-loose md:text-left">
                        © {new Date().getFullYear()} Shamba Sure. All Rights Reserved.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary">
                        Privacy Policy
                    </Link>
                    <Link to="/terms-of-service" className="text-sm text-muted-foreground hover:text-primary">
                        Terms of Service
                    </Link>
                </div>
            </div>
        </footer>
    );
}