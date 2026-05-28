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

interface LocationData {
  code: string;
  name: string;
  male: number;
  female: number;
  total: number;
}

export function LearnersByLocation() {
  const [data, setData] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/map")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-sm text-muted-foreground">
        No location data available
      </div>
    );
  }

  const chartData = data
    .sort((a, b) => b.total - a.total)
    .map((d) => ({
      name: d.name.length > 12 ? d.name.slice(0, 12) + "..." : d.name,
      fullName: d.name,
      male: d.male,
      female: d.female,
      total: d.total,
    }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
        <XAxis
          dataKey="name"
          fontSize={11}
          angle={-45}
          textAnchor="end"
          height={70}
          tickLine={false}
        />
        <YAxis fontSize={12} tickFormatter={(v) => v.toLocaleString()} />
        <Tooltip
          formatter={(value, name) => [
            Number(value).toLocaleString(),
            name === "male" ? "Male" : "Female",
          ]}
          labelFormatter={(_, payload) => {
            if (payload && payload[0]) {
              return (payload[0].payload as any).fullName;
            }
            return "";
          }}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            fontSize: "13px",
          }}
        />
        <Legend
          formatter={(value) => (value === "male" ? "Male" : "Female")}
          iconType="circle"
        />
        <Bar dataKey="male" stackId="a" fill="#4f7df5" radius={[0, 0, 0, 0]} name="male" />
        <Bar dataKey="female" stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} name="female" />
      </BarChart>
    </ResponsiveContainer>
  );
}
