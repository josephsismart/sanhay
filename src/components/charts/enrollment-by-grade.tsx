"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface GradeData {
  grade: string;
  male: number;
  female: number;
  total: number;
}

export function EnrollmentByGrade() {
  const [data, setData] = useState<GradeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/learners")
      .then((res) => res.json())
      .then((d) => {
        setData(d.byGrade || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
        No enrollment data available
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.grade.replace("Grade ", "G").replace("grade ", "G"),
    male: d.male,
    female: d.female,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
        <XAxis dataKey="name" fontSize={11} tickLine={false} />
        <YAxis fontSize={11} tickFormatter={(v) => v.toLocaleString()} />
        <Tooltip
          formatter={(value, name) => [
            Number(value).toLocaleString(),
            name === "male" ? "Male" : "Female",
          ]}
          contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
        />
        <Legend formatter={(v) => (v === "male" ? "Male" : "Female")} iconType="circle" />
        <Bar dataKey="male" fill="#4f7df5" radius={[0, 0, 0, 0]} name="male" />
        <Bar dataKey="female" fill="#ec4899" radius={[4, 4, 0, 0]} name="female" />
      </BarChart>
    </ResponsiveContainer>
  );
}
