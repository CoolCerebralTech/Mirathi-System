// FILE: src/pages/public/ContactPage.tsx

import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Label } from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';

export function ContactPage() {
  return (
    <div className="container py-10">
      <PageHeader
        title="Contact Us"
        description="Have questions? We'd love to hear from you."
      />
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
            <h3 className="text-xl font-semibold">Get in Touch</h3>
            <p className="text-muted-foreground">
                You can reach us via email or visit our offices during business hours.
            </p>
            <div className="space-y-2">
                <p><strong>Email:</strong> support@shambasure.com</p>
                <p><strong>Phone:</strong> +254 123 456 789</p>
                <p><strong>Address:</strong> 123 Shamba Lane, Nairobi, Kenya</p>
            </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
            </CardHeader>
            <CardContent>
                <form className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input id="name" placeholder="John Mwangi" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Your Email</Label>
                        <Input id="email" type="email" placeholder="john@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea id="message" placeholder="Your message..." />
                    </div>
                    <Button type="submit">Send Message</Button>
                </form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}