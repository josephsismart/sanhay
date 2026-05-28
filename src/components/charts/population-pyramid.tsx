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
  ReferenceLine,
} from "recharts";

interface PopulationData {
  age: string;
  male: number;
  female: number;
}

export function PopulationPyramid() {
  const [data, setData] = useState<PopulationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/population")
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
        No population data available
      </div>
    );
  }

  const pyramidData = data.map((d) => ({
    age: d.age,
    male: -d.male,
    female: d.female,
  }));

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.male, d.female))
  );

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={pyramidData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
        barGap={0}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
        <XAxis
          type="number"
          domain={[-maxVal - 100, maxVal + 100]}
          tickFormatter={(v) => Math.abs(v).toString()}
          fontSize={12}
        />
        <YAxis
          type="category"
          dataKey="age"
          width={35}
          fontSize={12}
          tickLine={false}
        />
        <Tooltip
          formatter={(value, name) => [
            Math.abs(value).toLocaleString(),
            name === "male" ? "Male" : "Female",
          ]}
          labelFormatter={(label) => `Age: ${label}`}
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
        <ReferenceLine x={0} stroke="#d1d5db" />
        <Bar dataKey="male" fill="#4f7df5" radius={[4, 0, 0, 4]} name="male" />
        <Bar dataKey="female" fill="#ec4899" radius={[0, 4, 4, 0]} name="female" />
      </BarChart>
    </ResponsiveContainer>
  );
}
