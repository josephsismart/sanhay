import ComingSoon from "@/components/dashboard/coming-soon";
import { School } from "lucide-react";

export default function SchoolsPage() {
  return (
    <ComingSoon
      title="Schools"
      icon={School}
      description="Manage school directory, branches, and configurations across the district."
      features={[
        "School profiles with logo, address, and contact info",
        "DepEd ID and registration tracking",
        "Active school year toggle per branch",
        "Quick switch between schools for multi-campus admins",
      ]}
    />
  );
}
