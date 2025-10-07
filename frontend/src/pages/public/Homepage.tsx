// FILE: src/pages/public/HomePage.tsx

import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export function HomePage() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-5xl">
          Secure Your Legacy. <br className="hidden sm:inline" />
          Simplify Land Succession in Kenya.
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Shamba Sure is a modern, secure platform designed to help Kenyan families
          manage land inheritance, prevent disputes, and protect generational wealth.
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link to="/register">Get Started</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/about">Learn More</Link>
        </Button>
      </div>
    </section>
  );
}