# OnCallRescue — Emergency Medical ID System

> Encrypted emergency identity — accessible when it matters most. ₹199 lifetime.

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

Requires MongoDB running locally (default: `mongodb://localhost:27017/oncallrescue`).

## Admin Login
- URL: `/admin/login`
- Default credentials in `.env.local`: `admin` / `OnCallRescue@2025`

## Agent Flow
1. Register at `/agent/register` (5-step KYC with Aadhar, PAN, bank details)
2. Admin verifies from `/admin/dashboard`
3. Login at `/agent/login` with phone + password
4. Portal at `/agent/portal` — scan sticker QR, enter customer phone, collect ₹199, activate

## Customer Flow
1. Gets SMS link from agent → fills profile at `/customer/register`
2. Dashboard at `/owner/dashboard?phone=XXXXXXXXXX`

## Emergency Flow
1. `/emergency/scan?id=LL-XXXXX` — scan page
2. `/vehicle-lookup` — alternative lookup by vehicle number

## Environment Variables
```
MONGODB_URI=mongodb://localhost:27017/oncallrescue
JWT_SECRET=change-this-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=OnCallRescue@2025
```
