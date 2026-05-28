"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, Sparkles, ArrowRight, Users, ScanLine, Star,
  BookOpen, Heart, Menu, X, CheckCircle2, MapPin, Phone,
  Mail, Clock, Trophy, GraduationCap, Globe, ChevronRight,
  ChevronLeft, Megaphone, Newspaper, Bell, Pin, Award, Info,
} from "lucide-react";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Programs", href: "#programs" },
  { label: "News", href: "#news" },
  { label: "Contact", href: "#contact" },
];

const banners = [
  { id: 1, img: "/b0_2024.jpg" },
  { id: 2, img: "/b1_2024.jpg" },
  { id: 3, img: "/b2_2024.jpg" },
];

const announcements = [
  {
    date: "May 28, 2026",
    title: "Enrollment for SY 2026–2027 is Now Open",
    desc: "Enrollment for incoming Grade 7 and transferee students is now open. Visit the Registrar's Office or enroll through the student portal. Requirements: Form 138, PSA Birth Certificate, and 2x2 ID photo.",
    tag: "Enrollment",
    tagColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Bell, iconBg: "bg-indigo-100", iconColor: "text-indigo-600",
    pinned: true,
  },
  {
    date: "May 25, 2026",
    title: "ANHS Bags Regional Science Fair Trophy",
    desc: "Congratulations to our STEM students for clinching 1st place at the Regional Science and Technology Fair! The team will represent our region at the national level in June.",
    tag: "Achievement",
    tagColor: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Award, iconBg: "bg-amber-100", iconColor: "text-amber-600",
    pinned: false,
  },
  {
    date: "May 20, 2026",
    title: "Early Graduation Ceremony — Class of 2026",
    desc: "The graduation ceremony for Senior High School Class of 2026 will be held on June 5, 2026 at the school gymnasium. Attendance of graduates and their families is required.",
    tag: "Event",
    tagColor: "bg-violet-50 text-violet-700 border-violet-200",
    icon: GraduationCap, iconBg: "bg-violet-100", iconColor: "text-violet-600",
    pinned: false,
  },
  {
    date: "May 15, 2026",
    title: "School Clinic Advisory: Dengue Prevention",
    desc: "With the rainy season approaching, the school clinic urges all students and staff to take precautions against dengue. Report any symptoms immediately to the clinic.",
    tag: "Health Advisory",
    tagColor: "bg-red-50 text-red-700 border-red-200",
    icon: Info, iconBg: "bg-red-100", iconColor: "text-red-600",
    pinned: false,
  },
  {
    date: "May 10, 2026",
    title: "2026 Intramurals Schedule Released",
    desc: "The official schedule for the ANHS Intramurals 2026 has been released. All homeroom advisers are requested to register their class teams by May 30.",
    tag: "Sports",
    tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: Trophy, iconBg: "bg-emerald-100", iconColor: "text-emerald-600",
    pinned: false,
  },
  {
    date: "May 5, 2026",
    title: "New School Portal Launched",
    desc: "The ANHS School Information Portal is now live. Students and teachers can access grades, attendance, and announcements through the portal. Contact the ICT coordinator for login assistance.",
    tag: "Technology",
    tagColor: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Sparkles, iconBg: "bg-blue-100", iconColor: "text-blue-600",
    pinned: false,
  },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 4500);
  };

  useEffect(() => {
    if (!isPaused) startTimer();
    else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPaused]);

  const goTo = (idx: number) => {
    setCurrentBanner(idx);
    startTimer();
  };
  const prev = () => goTo((currentBanner - 1 + banners.length) % banners.length);
  const next = () => goTo((currentBanner + 1) % banners.length);

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">

      {/* ── Navigation ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/anhs-logo.png" alt="ANHS Logo" width={40} height={40} className="rounded-full" />
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-bold leading-tight tracking-tight">Agusan National High School</span>
              <span className="text-[10px] text-muted-foreground leading-tight">Butuan City, Philippines</span>
            </div>
            <span className="sm:hidden text-sm font-bold tracking-tight">ANHS</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Button key={link.label} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
            <div className="w-px h-5 bg-border mx-2" />
            <Button size="sm" className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white" asChild>
              <Link href="/login">Portal Login</Link>
            </Button>
          </nav>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className="block py-2.5 text-sm font-medium text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="border-t pt-3 mt-2">
              <Button className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700 text-white" asChild>
                <Link href="/login">Portal Login</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-indigo-900 to-blue-900" />
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center text-center py-16 sm:py-24 lg:py-28 text-white">
            <Image src="/anhs-logo.png" alt="ANHS Logo" width={96} height={96}
              className="mx-auto mb-6 rounded-full shadow-2xl shadow-black/30 ring-4 ring-white/20" />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Agusan National<br />High School
            </h1>
            <p className="mt-3 flex items-center gap-2 text-sm sm:text-base text-blue-200">
              <MapPin className="h-3.5 w-3.5" /> Butuan City, Agusan del Norte, Philippines
            </p>
            <p className="mt-5 max-w-xl text-sm sm:text-base leading-relaxed text-blue-100/80 px-2">
              Nurturing excellence, building character, and empowering the youth
              of Agusan since day one. Where every student is given the opportunity
              to learn, grow, and succeed.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col w-full sm:w-auto sm:flex-row gap-3 px-2 sm:px-0">
              <Button size="lg" className="w-full sm:w-auto gap-2 rounded-full bg-white text-indigo-700 hover:bg-blue-50 shadow-lg px-8 h-12 text-sm font-bold" asChild>
                <Link href="#news">
                  <Newspaper className="h-4 w-4" /> News &amp; Announcements
                </Link>
              </Button>
              <Button size="lg" className="w-full sm:w-auto gap-2 rounded-full border-2 border-white/40 bg-white/10 text-white hover:bg-white/20 px-8 h-12 text-sm font-semibold" asChild>
                <Link href="/login">
                  Portal Login <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1440 54" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block" style={{display:"block",marginBottom:"-2px"}}>
            <path d="M0,32 C240,56 480,8 720,32 C960,56 1200,8 1440,32 L1440,54 L0,54 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Sliding Banner / Carousel ───────────────────────────── */}
      <section className="bg-white -mt-1 pt-6 sm:pt-8 pb-8 sm:pb-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div
            className="relative rounded-2xl overflow-hidden shadow-xl h-52 sm:h-64"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Slides */}
            {banners.map((b, i) => (
              <div
                key={b.id}
                className={`absolute inset-0 transition-opacity duration-700 ${i === currentBanner ? "opacity-100 z-10" : "opacity-0 z-0"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}

            {/* Prev / Next */}
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-300 ${i === currentBanner ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/70"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick stats ─────────────────────────────────────────── */}
      <section className="bg-white pb-10 sm:pb-14">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-6 lg:grid-cols-4">
          {[
            { label: "Years of excellence", value: "50+", icon: Trophy, color: "text-amber-600 bg-amber-50" },
            { label: "Students enrolled", value: "10K+", icon: Users, color: "text-indigo-600 bg-indigo-50" },
            { label: "Dedicated teachers", value: "200+", icon: GraduationCap, color: "text-emerald-600 bg-emerald-50" },
            { label: "Programs offered", value: "8+", icon: BookOpen, color: "text-pink-600 bg-pink-50" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2 text-center p-4 rounded-2xl bg-muted/30">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── About ───────────────────────────────────────────────── */}
      <section id="about" className="py-16 sm:py-24 border-t scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <Badge variant="secondary" className="mb-3 rounded-full px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 border-indigo-200">
                About ANHS
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Shaping the future of<br />Agusan&apos;s youth
              </h2>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Agusan National High School is one of the premier public secondary schools
                in Butuan City. We are committed to providing quality education that develops
                holistic, competent, and values-driven individuals ready for the challenges
                of the 21st century.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  "DepEd-accredited public high school",
                  "Senior High School with multiple strands",
                  "Active co-curricular and extracurricular programs",
                  "Modern facilities and digital classrooms",
                  "School Information System for real-time records",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Star className="h-4 w-4 text-indigo-600" />
                    </div>
                    <CardTitle className="text-base font-bold">Our Vision</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A globally competitive institution that nurtures lifelong learners
                    who are innovative, resilient, and socially responsible citizens.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-blue-600" />
                    </div>
                    <CardTitle className="text-base font-bold">Our Mission</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    To provide quality, inclusive, and accessible education that empowers
                    learners with knowledge, skills, and values for personal and national development.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-2 border-violet-100 bg-gradient-to-br from-violet-50/50 to-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Heart className="h-4 w-4 text-violet-600" />
                    </div>
                    <CardTitle className="text-base font-bold">Core Values</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {["Excellence", "Integrity", "Teamwork", "Innovation", "Service"].map((v) => (
                      <Badge key={v} variant="secondary" className="rounded-full text-xs bg-violet-50 text-violet-700 border-violet-200">{v}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ── Programs ────────────────────────────────────────────── */}
      <section id="programs" className="py-16 sm:py-24 bg-muted/30 border-y scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <Badge variant="secondary" className="mb-3 rounded-full px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 border-indigo-200">
              Academic Programs
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Programs &amp; tracks we offer</h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              From Junior High to Senior High — explore the tracks and strands that shape our students&apos; futures.
            </p>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BookOpen, title: "Junior High School", desc: "Grades 7-10 with the K-12 enhanced basic education curriculum.", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
              { icon: GraduationCap, title: "STEM", desc: "Science, Technology, Engineering, and Mathematics strand.", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
              { icon: Users, title: "HUMSS", desc: "Humanities and Social Sciences for future educators and leaders.", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
              { icon: BarChart3, title: "ABM", desc: "Accountancy, Business, and Management for future entrepreneurs.", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
            ].map((p) => (
              <Card key={p.title} className={`border-2 ${p.border} bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                <CardHeader className="p-5">
                  <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${p.bg}`}>
                    <p.icon className={`h-5 w-5 ${p.color}`} />
                  </div>
                  <CardTitle className="text-base font-bold">{p.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{p.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── News & Announcements ────────────────────────────────── */}
      <section id="news" className="py-16 sm:py-24 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-4">
            <div>
              <Badge variant="secondary" className="mb-2 rounded-full px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 border-indigo-200">
                <Megaphone className="h-3 w-3 mr-1 inline" /> Stay Informed
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">News &amp; Announcements</h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-lg">
                Stay up to date with the latest happenings, events, and important notices from ANHS.
              </p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {announcements.slice(0, visibleCount).map((a) => {
              const Icon = a.icon;
              return (
                <Card key={a.title} className={`bg-white border hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${a.pinned ? "ring-2 ring-indigo-200" : ""}`}>
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.iconBg}`}>
                        <Icon className={`h-4 w-4 ${a.iconColor}`} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {a.pinned && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                            <Pin className="h-2.5 w-2.5" /> Pinned
                          </span>
                        )}
                        <Badge variant="secondary" className={`rounded-full text-[10px] px-2 py-0.5 border ${a.tagColor}`}>{a.tag}</Badge>
                      </div>
                    </div>
                    <CardTitle className="text-sm font-bold leading-snug">{a.title}</CardTitle>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                      <Megaphone className="h-3 w-3" /> {a.date}
                    </p>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {visibleCount < announcements.length && (
            <div className="mt-8 text-center">
              <Button variant="outline" className="rounded-full gap-2 px-6" onClick={() => setVisibleCount(announcements.length)}>
                Show all {announcements.length} announcements <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────────── */}
      <section id="contact" className="py-16 sm:py-24 bg-muted/30 border-t scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <Badge variant="secondary" className="mb-3 rounded-full px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 border-indigo-200">
              Contact Us
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Get in touch</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: MapPin, title: "Address", desc: "Agusan National High School, Butuan City, Agusan del Norte, Philippines", color: "text-indigo-600 bg-indigo-50" },
              { icon: Phone, title: "Phone", desc: "(085) 342-XXXX", color: "text-blue-600 bg-blue-50" },
              { icon: Mail, title: "Email", desc: "info@anhs.edu.ph", color: "text-violet-600 bg-violet-50" },
              { icon: Clock, title: "Office Hours", desc: "Monday - Friday, 7:00 AM - 5:00 PM", color: "text-emerald-600 bg-emerald-50" },
            ].map((c) => (
              <Card key={c.title} className="text-center bg-white border">
                <CardHeader className="p-5 pb-2">
                  <div className={`mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl ${c.color}`}>
                    <c.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-sm font-bold">{c.title}</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t bg-blue-950 text-white py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Image src="/anhs-logo.png" alt="ANHS" width={36} height={36} className="rounded-full" />
                <div>
                  <p className="text-sm font-bold">Agusan National High School</p>
                  <p className="text-xs text-blue-300">Butuan City, Philippines</p>
                </div>
              </div>
              <p className="text-xs text-blue-300/70 leading-relaxed max-w-xs">
                Nurturing excellence, building character, and empowering the youth of Agusan.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3">Quick Links</p>
              <div className="space-y-2">
                {[
                  { label: "About", href: "#about" },
                  { label: "Programs", href: "#programs" },
                  { label: "News & Announcements", href: "#news" },
                  { label: "Contact", href: "#contact" },
                  { label: "Portal Login", href: "/login" },
                ].map((l) => (
                  <Link key={l.label} href={l.href} className="block text-sm text-blue-200 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3">School Portal</p>
              <div className="space-y-2 text-sm text-blue-200">
                <p className="flex items-center gap-2"><ScanLine className="h-3.5 w-3.5" /> Grades &amp; Attendance</p>
                <p className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> School Information System</p>
                <p className="flex items-center gap-2"><BarChart3 className="h-3.5 w-3.5" /> Real-time dashboards</p>
              </div>
            </div>
          </div>
          <div className="border-t border-blue-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-blue-400">
                &copy; {new Date().getFullYear()} Agusan National High School. All rights reserved.
              </p>
              <p className="text-xs text-blue-500">
                Developed by <span className="text-blue-300 font-medium">Joseph O. Sismar</span> &middot;{" "}
                <a href="mailto:josephsismart@gmail.com" className="text-blue-400 hover:text-blue-200 transition-colors">josephsismart@gmail.com</a>
              </p>
            </div>
            <p className="text-xs text-blue-500 flex items-center gap-1">
              Powered by ANHS School Information System <Heart className="h-3 w-3 text-pink-400 fill-pink-400" />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
