// FILE: src/pages/public/AboutPage.tsx

import { PageHeader } from '../../components/common/PageHeader';

export function AboutPage() {
  return (
    <div className="container py-10">
      <PageHeader
        title="About Shamba Sure"
        description="Our mission is to bring peace of mind to Kenyan families through technology."
      />
      <div className="mt-6 max-w-3xl space-y-4 text-muted-foreground">
        <p>
          Land ownership and inheritance in Kenya are often fraught with complexities, leading to
          numerous family disputes, fragmented record-keeping, and a congested legal system.
          These challenges not only cause emotional distress but also result in the loss of generational wealth.
        </p>
        <p>
          Shamba Sure emerges as a timely and innovative solution, aiming to simplify
          inheritance, protect generational wealth, and resolve conflicts through a secure, mobile-first platform.
          We believe that by providing clear, accessible tools for estate planning and document management,
          we can empower landowners to secure their legacy for generations to come.
        </p>
        <p>
          Our platform is built on the principles of security, simplicity, and trust. We leverage modern
          technology to tackle age-old problems, ensuring that your family's future is protected.
        </p>
      </div>
    </div>
  );
}