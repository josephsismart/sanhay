import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  features?: string[];
  backHref?: string;
}

export default function ComingSoon({
  title,
  description = "We're putting the finishing touches on this module. It will be available soon.",
  icon: Icon = Construction,
  features = [],
  backHref = "/admin",
}: ComingSoonProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>

      <Card className="border-dashed border-2 bg-gradient-to-br from-indigo-50/40 to-white">
        <CardContent className="py-16 px-6 flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
            <Icon className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Coming Soon</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>

          {features.length > 0 && (
            <div className="w-full max-w-md mb-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                What's Coming
              </p>
              <ul className="space-y-2 text-sm text-left">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button variant="outline" asChild>
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
