"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export function GenderPie() {
  const [gender, setGender] = useState({ male: 0, female: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/learners")
      .then((res) => res.json())
      .then((d) => {
        setGender(d.gender || { male: 0, female: 0, total: 0 });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[250px]">
        <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const pieData = [
    { name: "Male", value: gender.male, color: "#4f7df5" },
    { name: "Female", value: gender.female, color: "#ec4899" },
  ];

  const malePct = gender.total > 0 ? Math.round((gender.male / gender.total) * 100) : 0;
  const femalePct = gender.total > 0 ? Math.round((gender.female / gender.total) * 100) : 0;

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {pieData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [Number(value).toLocaleString(), name]}
            contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-2">
        <div className="text-center">
          <div className="flex items-center gap-1.5 justify-center">
            <div className="h-2.5 w-2.5 rounded-full bg-[#4f7df5]" />
            <span className="text-xs text-muted-foreground">Male</span>
          </div>
          <p className="text-lg font-extrabold">{gender.male.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{malePct}%</p>
        </div>
        <div className="text-center">
          <div className="flex items-center gap-1.5 justify-center">
            <div className="h-2.5 w-2.5 rounded-full bg-[#ec4899]" />
            <span className="text-xs text-muted-foreground">Female</span>
          </div>
          <p className="text-lg font-extrabold">{gender.female.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{femalePct}%</p>
        </div>
      </div>
    </div>
  );
}
