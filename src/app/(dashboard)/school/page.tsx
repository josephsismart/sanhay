"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SchoolRoot() {
  const router = useRouter();
  useEffect(() => { router.replace("/school/learners"); }, [router]);
  return null;
}
