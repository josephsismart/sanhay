import ComingSoon from "@/components/dashboard/coming-soon";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <ComingSoon
      title="Settings"
      icon={Settings}
      description="Configure system-wide preferences, school year, and academic settings."
      features={[
        "Active school year and quarter management",
        "Grading period dates and grade input cutoffs",
        "School profile (name, logo, address, contact)",
        "ID card template designer",
        "Email and notification preferences",
        "Backup and data export tools",
      ]}
    />
  );
}
