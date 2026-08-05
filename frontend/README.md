# ICARE-CVD Frontend

Next.js frontend using App Router and route groups.

## Run

```bash
npm install
npm run dev
```

App runs on [http://localhost:3000](http://localhost:3000).

## App Structure

```txt
src/app/
├── (auth)/
│   └── login/
│       ├── page.tsx
│       ├── LoginForm.tsx
│       ├── useLogin.ts
│       └── login.types.ts
└── (assistant)/
    ├── prescriptions/
    │   ├── page.tsx
    │   ├── PrescriptionForm.tsx
    │   ├── usePrescription.ts
    │   └── prescription.types.ts
    └── teleconsult/
        ├── page.tsx
        ├── TeleconsultRoom.tsx
        ├── useTeleconsult.ts
        └── teleconsult.types.ts
```

## Public Assets Structure

```txt
public/
├── images/
│   ├── logo/
│   ├── avatars/
│   ├── illustrations/
│   ├── icons/
│   └── og/
├── fonts/
├── icons/
├── manifest.json
├── robots.txt
└── sitemap.xml
```
