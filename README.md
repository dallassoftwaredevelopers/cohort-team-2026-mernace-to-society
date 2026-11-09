# Billio

> **Problem:** Property management teams need to track bills across many properties. Bill intake, vendor matching, and approval decisions can otherwise become manual and fragmented.
>
> **Solution:** Billio brings property and vendor records, bill entry and upload, AI-assisted extraction, and approval workflows into one application.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema](#database-schema)
4. [Authentication Flow](#authentication-flow)
5. [Key Features](#key-features)
6. [API Structure](#api-structure)
7. [Component Structure](#component-structure)
8. [Data Flow](#data-flow)
9. [Deployment](#deployment)
10. [Git Workflow](#git-workflow)
11. [Color Branding](#color-branding)
12. [Run Locally](#run-locally)
13. [Useful Commands](#useful-commands)
14. [Team](#team)

## Introduction

Billio is a property bill management application for property management teams. It helps users manage properties, vendors, and vendor accounts, enter or upload bills, review extracted details, and route bills through an approval queue.

## Architecture Overview

The frontend is a React application. Supabase provides authentication, PostgreSQL, private file storage, and server-side Edge Functions. Bill document extraction is performed through OpenRouter from an Edge Function.

| Component | Description |
| --- | --- |
| Frontend | React application built and served during development by Vite |
| Backend | Supabase Edge Functions running on Deno |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| File storage | Supabase Storage; bill uploads use the `invoices` bucket |
| Document extraction | OpenRouter called by the `extract-bill` Edge Function |

### Development tools

| Tool | Use |
| --- | --- |
| npm | Frontend dependencies and scripts |
| ESLint | Frontend linting |
| Supabase CLI | Local Supabase services, migrations, and function deployment |
| Jira | Team task planning and issue tracking |
| Figma | Database schema planning and UI mockups |
| Discord | Main team communication |
| Loom | Demonstrations and walkthroughs |
| Git and GitHub | Source control and team collaboration |

## Database Schema

Supabase PostgreSQL stores the application records. The following tables and fields are referenced by the current application; this is a high-level map, not a complete schema definition.

| Table | Examples of fields used by the app | Purpose |
| --- | --- | --- |
| `user` | `id`, `name`, `role` | Application user details and approval role |
| `property` | `id`, `name`, `status` | Managed properties |
| `vendor` | `id`, `name`, `status` | Vendor records |
| `vendor_account` | `id`, `vendor_id`, `property_id`, `account_number`, `service`, `payment_type`, `status` | Vendor service/account associated with a property |
| `bill` | `id`, `invoice_number`, `amount`, `issue_date`, `due_date`, `status`, `review_reason`, `rejection_reason`, `vendor_account_id`, `property_id`, `created_by`, `approved_by`, `approved_on`, `source` | Bill details and workflow state |
| `audit_trail` | `bill_id`, `user_id`, `action`, `from_status`, `to_status`, `note`, `created_at` | Approval and rejection history |

Database changes are maintained in `supabase/migrations/`. Local seed data is in `supabase/seed.sql`.

## Authentication Flow

1. A user signs in or registers through the frontend using Supabase Auth.
2. The Supabase client maintains the user session and attaches the session token to authenticated requests.
3. Edge Functions that require a user validate the request and perform operations using the caller's Supabase context.
4. PostgreSQL Row Level Security policies control which records the authenticated user can read or update.
5. Bill approval decisions are restricted to users with an authorized role by the database approval function.

## Key Features

### Property and vendor management

- Maintain property and vendor records.
- Associate vendor accounts and services with properties.
- Use property/vendor account relationships when entering bills.

### Bill intake and extraction

- Enter bills manually or upload PDF, JPG, and PNG documents.
- Store uploaded documents in the private `invoices` bucket.
- Extract candidate vendor, account, invoice, amount, and date fields through an Edge Function.
- Match extracted account information to a vendor account when there is one unambiguous match.
- Review and correct bill details before submission.

### Review and approval

- Organize bills in Pending, Needs Review, Approved, and Rejected states.
- Allow authorized users to approve or reject bills.
- Require a reason when rejecting a bill.
- Record decisions in an approval history.

## API Structure

The application uses Supabase Edge Functions rather than a Next.js API or a separate Express API. Functions are configured in `supabase/config.toml` and implemented under `supabase/functions/`.

| Function | Purpose |
| --- | --- |
| `create-bill` | Validate and create a bill |
| `update-bill` | Validate and update an editable bill |
| `extract-bill` | Read a stored bill document and return extracted fields |
| `match-bill` | Match extracted account details to a vendor account |
| `read-approvals` | Load bills, approval history, and approval permission |
| `decide-bill` | Record an approval or rejection |
| `create-property`, `update-property`, `delete-property`, `read-properties` | Property operations |
| `create-vendor`, `update-vendor`, `delete-vendor`, `read-vendors` | Vendor operations |
| `read-property-details` | Load a property's details and associated bills |

Shared request validation and helpers live in `supabase/functions/_shared/`. Automated validation tests live in `supabase/functions/tests/`.

## Component Structure

### Layout components

- `AppLayout` — shared authenticated-page layout with sidebar and footer.
- `Sidebar` — primary application navigation.
- `Footer` — shared footer.

### Page components

- `DashboardPage` — application overview.
- `BillsPage` — bill list and bill editing.
- `UploadBillPage` — upload, extraction, vendor matching, and bill form flow.
- `ManualBillIntakePage` — manual bill entry.
- `ApprovalsPage` — pending/review queue and approval history.
- `PropertiesPage` and `PropertyDetailsPage` — property list and details.
- `VendorsPage` and `VendorFormPage` — vendor management.
- `LoginPage`, `SignUpPage`, `AccountSettingsPage` — authentication and account settings.

### Reusable components and hooks

- `BillDetailsForm` — shared bill input/edit form.
- `UploadDocument` — bill document upload control.
- `PropertyForm` and `VendorForm` — property/vendor forms.
- Hooks under `frontend/src/hooks/` — reusable property, vendor, and property-detail data access.
- `frontend/utils/supabase.js` — shared Supabase client.

## Data Flow

### Uploaded bill

1. The user selects a PDF, JPG, or PNG in `UploadDocument`.
2. The file is uploaded to the private Supabase Storage `invoices` bucket.
3. `UploadBillPage` calls `extract-bill` with the stored file path.
4. The extraction function downloads the file using the caller's access and calls OpenRouter.
5. The page calls `match-bill` to match extracted account details to a vendor account.
6. The bill form displays extracted candidate values and lets the user review or correct them.
7. On submission, `create-bill` validates the request and saves the bill.

### Approval decision

1. `read-approvals` returns bills, approval history, and whether the user can approve.
2. An authorized user reviews a bill and approves it or rejects it with a reason.
3. `decide-bill` validates the decision and calls the database function.
4. The bill status and corresponding audit-history row are updated transactionally.

## Deployment

### Supabase

Supabase hosts the PostgreSQL database, Auth, Storage, and Edge Functions. Link the CLI to the intended project before running remote operations:

```bash
npx supabase@latest login
npx supabase@latest link --project-ref YOUR_PROJECT_REF
npx supabase@latest migration list --remote
```

Preview pending migrations before applying them:

```bash
npx supabase@latest db push --dry-run --remote
npx supabase@latest db push --remote
```

Deploy an Edge Function with:

```bash
npx supabase@latest functions deploy FUNCTION_NAME
```

### Frontend

The frontend is built with Vite. Its production hosting provider and deployment workflow should be configured by the project maintainers. Build output is generated in `frontend/dist/`.

## Git Workflow

1. Update local `main`:
   ```bash
   git switch main
   git pull --ff-only origin main
   ```
2. Create a feature branch:
   ```bash
   git switch -c feature/short-description
   ```
3. Run relevant lint, build, and tests.
4. Stage and commit the files for the change.
5. Push the branch:
   ```bash
   git push -u origin feature/short-description
   ```
6. Open a pull request and request review before merging.

## Color Branding

The shared Tailwind theme is defined in `frontend/src/index.css`.

| Token | Color | Example utilities |
| --- | --- | --- |
| Primary | `#245bc4` | `bg-primary`, `text-primary` |
| Primary hover | `#1e4da6` | `hover:bg-primary-hover` |
| Sidebar | `#182b49` | `bg-sidebar`, `text-sidebar` |
| Sidebar hover | `#2b405d` | `hover:bg-sidebar-hover` |
| Section background | `#f8f8f8` | `bg-section` |
| Secondary | `#d9d9d9` | `bg-secondary` |

Prefer these theme utilities over one-off colors when styling shared UI.

## Run Locally

### Requirements

- Node.js and npm
- Docker Desktop for the local Supabase stack
- Supabase CLI (commands below use `npx`; a global CLI installation is optional)
- Deno to run Edge Function tests

### 1. Start Supabase

From the repository root:

```bash
npx supabase@latest start
```

The CLI prints the local API URL and publishable/anon key. Create `frontend/.env.local` with the values from your local stack:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=your-local-publishable-key
```

Use the actual values printed by the CLI if they differ. Do not commit credentials.

### 2. Configure bill extraction

Copy the Edge Function environment example:

```bash
cp supabase/functions/.env.example supabase/functions/.env
```

Set your own `OPENROUTER_API_KEY` in `supabase/functions/.env`. Keep this secret out of Git. To serve functions locally with this environment file:

```bash
npx supabase@latest functions serve --env-file supabase/functions/.env
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints, typically <http://localhost:5173>.

## Useful Commands

Run frontend commands from the repository root:

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
```

Run Edge Function tests from the repository root:

```bash
deno test supabase/functions/tests/
```

Manage the local Supabase stack from the repository root:

```bash
npx supabase@latest start
npx supabase@latest stop
```

## Team

- Adrian Crosby
- Aisha Umar
- Antonio Reyes
- Arnau Davis
- Audrey Clark
- Jake Johnson
- Sarah Al-Said
