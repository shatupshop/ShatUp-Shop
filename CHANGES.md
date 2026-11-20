# Changes in fresh-setup package

- Replaced outdated and contradictory README setup steps with one canonical fresh-install guide.
- Documented the exact Supabase migration order and admin email setup for a brand-new project.
- Removed old claims that missing Supabase credentials show sample demo products; the storefront uses an empty state.
- Centralized footer, quick-access and mobile WhatsApp links on `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- Updated developer credits to `✦ Developed by Rimon` and `Web Developer`.
- Renamed the internal `WhyRimonStore` component to `WhyShatUpShop` to remove legacy branding from code.
- Strengthened `.gitignore` so local environment files, build output and Vercel metadata are not uploaded.

## Verification status

- Source ZIP integrity checked.
- TypeScript and production build were not run in this environment because npm dependency installation timed out. Run `npm install`, `npm run typecheck` and `npm run build` before production deployment.
- Supabase SQL migrations and live authentication/storage flows must be run and verified in the newly created Supabase project using `DEPLOYMENT-BN.md`.
