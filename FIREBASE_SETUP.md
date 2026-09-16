# Zukas Kitchen Spin & Win — Firebase Integration & Admin Setup Guide

This document explains the Firebase Cloud Firestore integration, environment variable configuration, Firestore schema, campaign management controls, repeat-spin cooldown rules, security model, and Vercel deployment workflow for **Zukas Kitchen Spin & Win**.

---

## 1. Firebase Project Overview

- **Project Name**: `zukas-kitchen-spin-win`
- **Firebase Services**: Firebase Web SDK v12, Firebase Admin SDK v14, Cloud Firestore
- **Deployment Platform**: Vercel (Frontend Client App)

---

## 2. Environment Variable Setup

The React + Vite frontend accesses Firebase credentials using Vite's `import.meta.env` system.

### Local Development Setup (`.env`)

Create a `.env` file in the project root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Fill in your client SDK keys from **Firebase Console → Project Settings → Web Apps**:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=zukas-kitchen-spin-win.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=zukas-kitchen-spin-win
VITE_FIREBASE_STORAGE_BUCKET=zukas-kitchen-spin-win.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=1:your_app_id_here
```

> **Security Note**: Never commit `.env` or Firebase secrets to Git. Only `.env.example` with placeholders should be tracked.

---

## 3. Firestore Collection Structure

Firestore is the central source of truth for campaign status, repeat-spin cooldown rules, prize probabilities, and spin auditing records.

```text
Firestore Root
├── campaigns
│   └── spin_and_win
│       ├── enabled: true (boolean)
│       ├── campaignName: "Spin & Win" (string)
│       ├── spinDurationMs: 8500 (number)
│       ├── repeatEnabled: true (boolean)
│       ├── repeatAfterDays: 2 (number)
│       └── updatedAt: ServerTimestamp
│
├── prizes
│   ├── 25-off-combo  → { name: "₹25 OFF ON ORDER COMBO", weight: 10, enabled: true, couponPrefix: "ZUKAS25", isWinning: true }
│   ├── 10-percent    → { name: "10% OFF", weight: 55, enabled: true, couponPrefix: "ZUKAS10", isWinning: true }
│   ├── 20-off        → { name: "₹20 OFF", weight: 12, enabled: true, couponPrefix: "ZUKAS20", isWinning: true }
│   ├── better-luck   → { name: "BETTER LUCK NEXT TIME", weight: 10, enabled: true, couponPrefix: null, isWinning: false }
│   ├── 15-percent    → { name: "15% OFF", weight: 8, enabled: true, couponPrefix: "ZUKAS15", isWinning: true }
│   └── 30-off        → { name: "₹30 OFF", weight: 5, enabled: true, couponPrefix: "ZUKAS30", isWinning: true }
│
└── spins
    └── {spinId}
        ├── mobile: "+919876543210" (string)
        ├── prizeId: "10-percent" (string)
        ├── prizeName: "10% OFF" (string)
        ├── couponCode: "ZUKAS10X7K2" (string|null)
        ├── campaignId: "spin_and_win" (string)
        └── createdAt: ServerTimestamp
```

---

## 4. Configurable Repeat-Spin / Cooldown System

You control customer repeat spin behavior dynamically from **Firebase Console → Firestore Database → campaigns/spin_and_win**:

### Fields:
- `enabled`: `true` / `false` (Master campaign switch)
- `repeatEnabled`: `true` / `false` (Repeat spin toggle)
- `repeatAfterDays`: `N` (Cooldown period in days, e.g. 2, 3, 5, 7)

### How Cooldown Works:
1. When a customer enters their mobile number, the system queries Firestore for their **MOST RECENT** spin timestamp (`latestSpinAt`).
2. If `repeatEnabled === false`: The customer is permanently blocked from spinning again (*"You have already used your Spin & Win chance."*).
3. If `repeatEnabled === true`:
   - `nextEligibleAt = latestSpinAt + (repeatAfterDays * 86400 * 1000)`
   - If current time $\ge$ `nextEligibleAt`: **ALLOW SPIN**. The cooldown resets from the new spin.
   - If current time $<$ `nextEligibleAt`: **BLOCK SPIN** with a friendly countdown message (e.g. *"Your next spin is available in 2 days (on 18 Sept)."*).

### Admin Control Scenarios (No Code Changes & No Redeployment Needed):

- **Change Cooldown from 2 Days to 3 Days**:
  Go to document `campaigns/spin_and_win` in Firebase Console → Change `repeatAfterDays` to `3`. All future cooldown checks automatically enforce 3 days!
- **Change Cooldown to 5 Days**:
  Change `repeatAfterDays` to `5`.
- **Disable Repeat Spins Completely (One Spin Ever)**:
  Change `repeatEnabled` to `false`.

---

## 5. How to Enable / Disable the Campaign

To pause or shut down the Spin & Win campaign dynamically:

1. Open **Firebase Console → Firestore Database**.
2. Go to collection `campaigns`, document `spin_and_win`.
3. Set field `enabled` to `false`.
4. The web application immediately disables the spin input & button, displaying:
   > **Spin & Win is currently closed. Please check back soon! ❤️**

---

## 6. How to Modify Prize Weights & Probabilities

To change selection probability directly from Firebase Console:

1. Go to collection `prizes`.
2. Select the prize document (e.g. `10-percent`).
3. Update the `weight` field (e.g. change `55` to `40`).
4. Selection probability is calculated as `weight / sum(all_enabled_prize_weights)`.

---

## 7. Current Prize Weights Summary Table

| Prize ID | Prize Name / Label | Weight | Probability | Coupon Format | Is Winning |
|---|---|---|---|---|---|
| `10-percent` | **10% OFF** | **55** | **55%** | `ZUKAS10XXXX` | Yes |
| `20-off` | **₹20 OFF** | **12** | **12%** | `ZUKAS20XXXX` | Yes |
| `25-off-combo` | **₹25 OFF ON ORDER COMBO** | **10** | **10%** | `ZUKAS25XXXX` | Yes |
| `better-luck` | **BETTER LUCK NEXT TIME** | **10** | **10%** | None (`null`) | No |
| `15-percent` | **15% OFF** | **8** | **8%** | `ZUKAS15XXXX` | Yes |
| `30-off` | **₹30 OFF** | **5** | **5%** | `ZUKAS30XXXX` | Yes |

---

## 8. Current Security Model & Firestore Rules

Recommended Firestore Security Rules for client-side read access and controlled spin creation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Public read-only access for campaign config and prize definitions
    match /campaigns/{campaignId} {
      allow read: if true;
      allow write: if false; // Admin console / Admin SDK only
    }

    match /prizes/{prizeId} {
      allow read: if true;
      allow write: if false; // Admin console / Admin SDK only
    }

    // Public create access for user spin records
    match /spins/{spinId} {
      allow read: if request.query.limit <= 10;
      allow create: if request.resource.data.keys().hasAll(['mobile', 'prizeId', 'createdAt'])
                    && request.resource.data.mobile is string;
      allow update, delete: if false;
    }
  }
}
```

---

## 9. Vercel Deployment Guide

When deploying to Vercel:

1. Open project settings in **Vercel Dashboard → Settings → Environment Variables**.
2. Add all six `VITE_FIREBASE_*` variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. Trigger a fresh deployment (`git push` or Vercel CLI).
