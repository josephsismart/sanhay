# ANHS Portal — School Information System
## Project Handoff & Session Summary

**Date:** May 28, 2026
**Project:** Agusan National High School (ANHS) Portal
**Migrating from:** CodeIgniter 3 (PHP) → Next.js 15 (React/TypeScript)

---

## 1. PROJECT OVERVIEW

This is a **School Information System** for Agusan National High School, Butuan City, Philippines. Originally built with CodeIgniter 3 + PostgreSQL, we are migrating to Next.js with the same PostgreSQL database.

### Tech Stack (New)
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI:** Tailwind CSS + shadcn/ui (Nova preset, Radix)
- **Font:** Inter
- **ORM:** Prisma 6 (with multiSchema support)
- **Auth:** NextAuth v4 (Credentials provider, MD5 password matching)
- **Charts:** Recharts
- **Database:** PostgreSQL on Aiven (free tier, Asia Pacific)
- **Image Storage:** Cloudflare R2 (free, public bucket)
- **Color Theme:** Indigo/blue accent, playful & colorful style

### Legacy Tech Stack (Reference)
- **Framework:** CodeIgniter 3 (PHP)
- **Database:** PostgreSQL 15 (10 schemas, 51 tables, 10 views, 15 materialized views)
- **UI:** Bootstrap 4, AdminLTE 3, jQuery, DataTables, Highcharts
- **Location:** `C:\xampp\htdocs\sanhay` (legacy, read-only reference)

---

## 2. INFRASTRUCTURE

### Database — Aiven PostgreSQL (Free Tier)
- **Host:** `pg-d1d7f2a-sanhay.h.aivencloud.com`
- **Port:** `25622`
- **Database:** `defaultdb`
- **User:** `avnadmin`
- **SSL:** Required
- **Connection string in:** `.env` and `.env.local`
- **Schemas:** account, address, profile, building_sectioning, global, logs, id, sy1, sy2, public
- **Data:** Full import from legacy `sanhay.sql` — 51 tables with all production data

### Image Storage — Cloudflare R2
- **Bucket:** `sanhay-uploads`
- **Region:** Asia Pacific (APAC)
- **Public URL:** `https://pub-750611bb5be64b558b7cd6db734b9c32.r2.dev`
- **S3 Endpoint:** `https://b898ae28956420bd27535d59655a6049.r2.cloudflarestorage.com`
- **Design:** Store filename in DB (e.g., `students/a7f3c9b2.webp`), serve via public URL
- **Not yet wired up** — R2 upload helper code not written yet

### Neon PostgreSQL (Backup/Alternative)
- Account created but not actively used
- Connection: `ep-rapid-rice-aovtskxc.c-2.ap-southeast-1.aws.neon.tech`

---

## 3. PROJECT STRUCTURE

```
C:\Users\mis\Documents\Claude\Projects\sanhay\sanhay-app\
├── prisma/
│   └── schema.prisma          # Prisma schema (account, profile, global schemas)
├── public/
│   └── anhs-logo.png          # ANHS official school seal
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout (Inter font)
│   │   ├── page.tsx                   # Landing page (school website)
│   │   ├── login/page.tsx             # Centered login page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx             # Dashboard layout (sidebar + auth check)
│   │   │   ├── admin/page.tsx         # Admin dashboard (real DB data + charts)
│   │   │   └── teacher/
│   │   │       ├── page.tsx           # Teacher dashboard
│   │   │       ├── classes/page.tsx   # My Classes (expandable learner lists)
│   │   │       ├── grades/page.tsx    # Grades management
│   │   │       └── reports/page.tsx   # Report generation
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts  # NextAuth API
│   │       ├── dashboard/
│   │       │   ├── route.ts           # Dashboard stats API
│   │       │   ├── population/route.ts # Population pyramid data
│   │       │   ├── map/route.ts       # Learners by location data
│   │       │   └── learners/route.ts  # Detailed learner stats
│   │       └── teacher/
│   │           ├── route.ts           # Teacher classes API
│   │           └── learners/route.ts  # Learners per class API
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components
│   │   ├── dashboard/
│   │   │   └── app-sidebar.tsx        # Role-based sidebar navigation
│   │   └── charts/
│   │       ├── population-pyramid.tsx  # Age by sex horizontal bars
│   │       ├── learners-by-location.tsx # City/municipality stacked bars
│   │       ├── enrollment-by-grade.tsx  # Grade level grouped bars
│   │       ├── gender-pie.tsx          # Male/female donut chart
│   │       └── section-table.tsx       # Enrollment status + top sections
│   ├── lib/
│   │   ├── prisma.ts                  # Prisma client singleton
│   │   └── auth.ts                    # NextAuth config (v4)
│   ├── types/
│   │   └── next-auth.d.ts             # TypeScript session types
│   └── hooks/
├── .env                               # Prisma reads this
├── .env.local                         # Next.js reads this
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 4. AUTHENTICATION

### How it works
- NextAuth v4 with Credentials provider
- Passwords are MD5 hashed (matching legacy CI3 system)
- JWT session strategy with role info embedded
- Role-based redirect on login

### Test Accounts (password: `test123`)
| Username | Role | Level | Redirect |
|----------|------|-------|----------|
| `superadmin` | Super Admin | 1 | `/admin` |
| `abc@gmail.com` | School Admin | 6 | `/school` |
| `guard101@gmail.com` | Security Guard | 9 | `/guard` |
| `sharencatalan` | Teacher | 7 | `/teacher` |
| `juarengultiano` | Teacher | 7 | `/teacher` |

**Note:** Teachers need password reset in DB first:
```sql
UPDATE account.tbl_useraccount 
SET password = 'cc03e747a6afbbcbf8be7668acfebee5'
WHERE username IN ('sharencatalan', 'juarengultiano');
```

### Role Mapping
```
Level 1: Super Admin    → /admin
Level 2: Admin          → /admin
Level 3: Department Head → /department
Level 4: School Head    → /school
Level 5: School Planning → /school
Level 6: School Admin   → /school
Level 7: Teacher        → /teacher
Level 8: Student        → /student
Level 9: Security Guard → /guard
```

### Auth Files
- `src/lib/auth.ts` — NextAuth config with `authOptions`
- `src/app/api/auth/[...nextauth]/route.ts` — API route handler
- `src/types/next-auth.d.ts` — TypeScript type extensions
- Session includes: `id`, `name`, `email`, `image`, `role`, `roleLabel`, `changePwd`, `basicInfoId`

---

## 5. DATABASE SCHEMA (Prisma)

### Current Prisma Models (schema.prisma)
Only core models are defined — enough for auth and dashboard:

- **Role** (`account.tbl_role`) — 9 roles with levels
- **UserAccount** (`account.tbl_useraccount`) — login credentials
- **BasicInfo** (`profile.tbl_basicinfo`) — personal info (name, birthdate, photo)
- **SchoolYear** (`global.tbl_sy`) — school year settings

### Models NOT yet in Prisma (exist in DB, need adding)
- `profile.tbl_school` — School info
- `profile.tbl_school_department` — Departments
- `profile.tbl_schoolpersonnel` — Personnel records
- `profile.tbl_learners` — Learner records
- `building_sectioning.tbl_room_section` — Class sections
- `building_sectioning.tbl_room_section_subject_assignment` — Teacher assignments
- `global.tbl_party` / `tbl_partytype` — Universal lookup data
- `global.tbl_status` / `tbl_statustype` — Status records
- `address.*` — Region/Province/CityMun/Barangay/Purok
- `sy1.*` / `sy2.*` — School year enrollment and grades
- `logs.*` — Scan logs

**Note:** Raw SQL queries (`prisma.$queryRaw`) are used for complex cross-schema joins. Prisma models are used for simple CRUD.

### Full DB Schema Reference
The complete schema catalog (51 tables, all columns, constraints, views) was explored from `sanhay.sql`. Key schemas:
- **account** — User accounts and roles
- **profile** — Personnel, learners, schools, departments
- **building_sectioning** — Rooms, sections, subject assignments, schedules
- **global** — Party (universal lookups), school year, statuses, user logs
- **sy1/sy2** — Per-school-year enrollment and grades
- **address** — Philippine geographic hierarchy (Region→Province→CityMun→Barangay→Purok)

---

## 6. WHAT'S BUILT

### Pages Complete
| Route | Page | Status | Data Source |
|-------|------|--------|-------------|
| `/` | School website landing page | ✅ Done | Static |
| `/login` | Centered login page | ✅ Done | NextAuth |
| `/admin` | Admin dashboard | ✅ Done | Real DB (7 stat cards, 5 charts) |
| `/teacher` | Teacher dashboard | ✅ Done | Real DB (class assignments) |
| `/teacher/classes` | My Classes (expandable) | ✅ Done | Real DB (learner lists) |
| `/teacher/grades` | Grades management | ✅ UI only | Needs grade entry wiring |
| `/teacher/reports` | Reports | ✅ UI only | Needs report generation |

### Charts Built
1. **Learners by Location** — stacked bar (male/female per city/municipality)
2. **Population Pyramid** — horizontal bars (age bracket by sex)
3. **Enrollment by Grade Level** — grouped bar (male/female per grade)
4. **Gender Distribution** — donut pie chart (male/female ratio)
5. **Section Table** — enrollment status badges + top sections list
6. **User Accounts by Role** — horizontal progress bars

### Components Built
- `AppSidebar` — role-based sidebar with sign-out button
- `PopulationPyramid` — Recharts population pyramid
- `LearnersByLocation` — Recharts stacked bar
- `EnrollmentByGrade` — Recharts grouped bar
- `GenderPie` — Recharts donut
- `SectionTable` — status badges + ranked section list

---

## 7. WHAT'S NOT BUILT YET

### High Priority
- [ ] **Grade entry** — Q1-Q4 grade input per subject (the core teacher feature)
- [ ] **Personnel management** — CRUD for school personnel (admin feature)
- [ ] **Learner management** — CRUD for learners (enrollment, transfer, unenroll)
- [ ] **Department management** — CRUD for departments
- [ ] **School year settings** — Quarter config, deadlines, enrollment status
- [ ] **Student dashboard** — Student view of their grades
- [ ] **School admin dashboard** — Different from super admin

### Medium Priority
- [ ] **QR survey/feedback system** — The feedback hub feature (scan QR → rate)
- [ ] **R2 image upload** — Profile picture upload/resize/serve
- [ ] **Section management** — Grade-level sectioning
- [ ] **Subject assignment** — Assign subjects to teachers
- [ ] **Consolidated grade report** — Printable HTML report
- [ ] **Visitor/Gate management** — ID scanning system

### Low Priority
- [ ] **Map visualization** — Highcharts/D3 choropleth map of Agusan del Norte
- [ ] **Excel import/export** — Bulk learner import
- [ ] **Password change** — Force change on first login
- [ ] **Dark mode** — Theme toggle
- [ ] **Deploy to Vercel** — Production deployment

---

## 8. LEGACY SYSTEM REFERENCE

### Legacy Location
`C:\xampp\htdocs\sanhay` — DO NOT MODIFY, use as read-only reference

### Key Legacy Files
- `application/controllers/userschooladmin/Dashboard.php` — Admin dashboard controller
- `application/controllers/userschooladmin/Dataentry.php` — Admin data entry (1200+ lines)
- `application/controllers/userteacher/Dataentry.php` — Teacher enrollment/grades
- `application/controllers/userteacher/Getdata.php` — Teacher AJAX data endpoints
- `application/controllers/system/Login.php` — Login system with role routing
- `application/views/interface/userschooladmin/` — Admin views
- `application/views/interface/userteacher/` — Teacher views
- `application/config/routes.php` — All routes (170+ lines)
- `application/config/database.php` — DB config (develop/production)

### Legacy Dashboard Features
- 4 stat cards: Learners (10,679), Teaching (318), Non-Teaching (4), Scanned IDs (0)
- Graph I: Highcharts choropleth map of Agusan del Norte with drill-down to barangay
- Graph II: Population pyramid (age 13-22+ by sex)

### Legacy Admin Modules (Dataentry.php)
- Section 4a: Personnel Information Details (CRUD)
- Section 4b: Personnel User Account Setup
- Section 4c: Grade Level Subjects
- Section 4d: Grade Level Sectioning
- Section 4e: Departments
- Section 4f: Gateway & Visitor
- Section 4g: School Year and Quarter Settings

### Legacy Teacher Modules
- My Classes: Assigned sections with learner lists
- Enrollment: Batch enroll, import from Excel, transfer, unenroll
- Grades: Q1-Q4 entry per subject, performance standards
- Reports: Consolidated grades, ranking, signatures

---

## 9. ENVIRONMENT VARIABLES

### .env.local (all sensitive values)
```
DATABASE_URL=postgres://avnadmin:***@pg-d1d7f2a-sanhay.h.aivencloud.com:25622/defaultdb?sslmode=require
NEXTAUTH_SECRET=***
NEXTAUTH_URL=http://localhost:3000
R2_ACCESS_KEY_ID=***
R2_SECRET_ACCESS_KEY=***
R2_ENDPOINT=https://b898ae28956420bd27535d59655a6049.r2.cloudflarestorage.com
R2_BUCKET_NAME=sanhay-uploads
R2_PUBLIC_URL=https://pub-750611bb5be64b558b7cd6db734b9c32.r2.dev
```

**⚠️ IMPORTANT:** Credentials were exposed in the chat session. They should be rotated:
1. Aiven → reset DB password
2. Cloudflare → delete/recreate R2 API token
3. NextAuth → generate new secret

---

## 10. HOW TO RUN

```bash
cd C:\Users\mis\Documents\Claude\Projects\sanhay\sanhay-app

# Use Node 22 (via NVM)
nvm use 22

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev

# Open http://localhost:3000
```

### Common Commands
```bash
npx prisma validate     # Check schema syntax
npx prisma generate     # Regenerate client after schema changes
npx prisma db pull      # Introspect existing DB into schema
npx prisma studio       # Visual DB browser
npm run build           # Production build
```

---

## 11. DESIGN DECISIONS

1. **Inter font** — clean, universal, highly readable
2. **Indigo/blue accent** — professional but playful for school context
3. **Playful & colorful style** — bright colors, rounded shapes, friendly
4. **Mobile-first** — responsive design with hamburger menu
5. **Server components** — dashboard stats fetched server-side for fast initial load
6. **Client components** — charts fetched via API routes for streaming
7. **Raw SQL** — used for complex cross-schema joins (Prisma ORM for simple CRUD)
8. **MD5 passwords** — kept for backward compatibility with legacy accounts (should migrate to bcrypt eventually)
9. **Role-based sidebar** — different nav items per role level
10. **Centered login** — no split-screen, clean card on gradient background

---

## 12. KNOWN ISSUES

1. **Prisma schema is minimal** — only 4 models defined. Complex queries use `$queryRaw`
2. **No middleware protection** — dashboard layout checks auth but no Next.js middleware yet
3. **Grade entry not functional** — UI exists but no save/submit wiring
4. **Reports not functional** — Print/Export buttons are placeholders
5. **Landing page still has some "Sanhay" references** — need to audit all copy
6. **No loading states on dashboard** — server component loads all at once (could add Suspense)
7. **Teacher API queries may fail** — depends on teacher having assignments in the DB
8. **Password needs to be "test123"** — real passwords are unknown MD5 hashes

---

## 13. MYSQL CONVERSION (Bonus)

A MySQL conversion of the Postgres dump was also created:
- **File:** `C:\xampp\htdocs\sanhay\application\sanhay_mysql.sql`
- **Size:** 19.87 MB, 137,750 lines
- **Tables:** 51 (flattened schema names: `account__tbl_role`, etc.)
- **Purpose:** For InfinityFree hosting (MySQL only)
- **Note:** Not actively used since we moved to Aiven PostgreSQL

---

*This document was generated at the end of a marathon coding session. The next developer (or Sonnet) should use this as the starting point. Good luck bro! 🔥*
