import ComingSoon from "@/components/dashboard/coming-soon";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <ComingSoon
      title="Reports"
      icon={BarChart3}
      description="Generate DepEd-compliant reports and analytics for school administration."
      features={[
        "Enrollment by grade level, section, and strand",
        "Population pyramid and demographic breakdowns",
        "SF1, SF2, SF5 DepEd forms (PDF / Excel export)",
        "Grade distribution and academic performance reports",
        "Attendance and dropout tracking",
      ]}
    />
  );
}
