# Tenant Complaint Management System

React, Vite, Tailwind CSS, and React Router. The same-origin `/api/auth`, `/api/complaints`, `/api/tenants`, `/api/announcements`, and `/api/settings` endpoints connect the portal to Supabase.

## Run against development

From this directory, copy `.env.example` to `.env.local`. Set `TCMS_SUPABASE_URL` to the development project URL, `TCMS_SUPABASE_PUBLISHABLE_KEY` to its publishable key, and `TCMS_MANAGEMENT_AUTH_EMAIL` to the management Auth account identifier. `TCMS_SUPABASE_STORAGE_SECRET_KEY` is the server-only key for private Storage and tenant account administration. The server resolves tenant login identifiers from active occupancies. Account passwords are set in Supabase Auth. Keep the `TCMS_` prefix so these values stay server-side. The session response body contains the portal role and, for tenants, the unit number. Auth tokens are kept in secure, HTTP-only cookies. Sign-in stays persistent across refreshes and browser restarts, as before. The existing Remember me checkbox does not change that behavior.

```
npm install
npm run dev
```

Open the localhost address Vite prints. Use HTTPS outside localhost so the session cookies work. Vite serves the auth endpoint locally, and the Vercel function uses the same handler. Both login forms trim outer whitespace and verify the remaining password as entered.

## Initial development database

The [initial migration](supabase/migrations/20261124000000_initial_unit_access.sql) creates and seeds the five units, adds management memberships and tenant occupancies, and installs Row Level Security. This security runs inside PostgreSQL and limits which rows each user can read. Apply the migration through the Supabase CLI to the development project so Supabase records it in migration history. For initial testing, create one management and two tenant users in Supabase Auth. Register the management user's Auth UUID in `portal_managers.user_id` and the two tenants' Auth UUIDs and unit numbers in `unit_occupancies` as a database administrator. Public sign-up can be disabled in the development project's Auth settings.

The server calls `get_portal_access()` using the signed-in user's token. The function returns:

- Management receives `{"role":"management"}`.
- An active tenant receives `{"role":"tenant","unit":1,"occupancy_id":"<id>"}`.
- A caller without portal access receives JSON `null`.

The function uses `auth.uid()` and runs with the caller's own permissions. A tenant can read only their active occupancy and its unit. Management can read all units and occupancy history. Authenticated app users have read-only access to the tables and make permitted changes through management-checked functions.

For live verification, check valid and invalid passwords, refresh, logout, and route redirects. Read the unit and occupancy tables as each tenant using their own Auth token. End one occupancy by setting its `ended_at` in the database, then repeat the queries with the same token. It should return no unit or occupancy, and the portal should deny access on its next session check. For a replacement, create a new Auth identity and occupancy. A public lookup for tenant names remains pending approval.

## Text complaints

The [text complaint migration](supabase/migrations/20261124010000_text_complaints.sql) adds complaints and the `create_complaint` function. Submissions send categories and description. PostgreSQL derives the unit through the caller's current occupancy and starts the complaint at `Pending`. Management can read complaints from every occupancy. Tenants can read only complaints from their own active occupancy. Existing browser demo complaints are outside this migration.

The [complaint photos migration](supabase/migrations/20261124030000_complaint_photos.sql) adds the private `complaint-photos` bucket. Set `TCMS_SUPABASE_STORAGE_SECRET_KEY` in the server environment or the ignored `.env.local` for the development project. The server validates and decodes one JPEG, PNG, or WebP image up to 2 MB and 25 megapixels. Text-only submissions continue to use the text complaint function.

Photo submissions use the same attempt ID when retried with the same content. The app saves the complaint only after Storage confirms the file. A failed submission removes its staged file when the outcome is known. If Storage times out or cleanup fails, the reservation tracks the object path so a retry can reuse it safely. Photo downloads check the complaint's current access policy on every request. Administrative file cleanup should use the Storage API before deleting a complaint.

The [complaint management migration](supabase/migrations/20261124020000_complaint_management.sql) lets management update only repair status and the technician assignment. It records the time a complaint enters `Resolved` and clears that timestamp if the complaint is reopened. Resolved History loads currently resolved complaints from Supabase and keeps its existing date-reported filters and CSV columns.

## Tenant provisioning

The [tenant provisioning migration](supabase/migrations/20261124040000_tenant_provisioning.sql) connects the Tenants and Units tabs to active occupancies and Supabase Auth. Management assigns a vacant unit from the existing form. Retrying the same assignment reuses its Auth account if the first attempt created it. An empty password on Edit saves only the tenant details. Show and Copy Login Info use the newly entered password in the current Tenants tab and clear it when leaving that tab or reloading.

Vacate ends the occupancy, which immediately removes the tenant's portal, complaint, and photo access. The previous occupancy and its records remain available to management. A replacement uses a separate Auth account and occupancy.

## Announcements

The [announcements migration](supabase/migrations/20261124050000_announcements.sql) starts with an empty feed. Management can read, publish, and delete notices. Tenants can read notices while they have an active occupancy. The tenant dashboard preview, notice list, and count share the feed and update on refresh.

## Property settings and management password

The [property settings migration](supabase/migrations/20261124060000_property_settings.sql) seeds the existing defaults. Management reads and edits the settings. My Unit reads the saved property name and address through a database function for active tenants.

The password form reauthenticates the signed-in management account with its current password before updating it in Supabase Auth. The editable contact email is stored in the settings row. Password-only management login continues to use `TCMS_MANAGEMENT_AUTH_EMAIL` server-side.

## Run the development demo

From this app directory, choose and confirm the demo passwords in your own terminal. Input is hidden and the passwords are saved in Supabase Auth.

```sh
node scripts/set-demo-passwords.mjs
npm run dev -- --mode demo
```

Open the localhost URL printed by Vite. Use `/management/login` for management and `/unit/1/login` for the demo tenant. Demo mode uses the server-side `.env.demo.local` account mapping.
