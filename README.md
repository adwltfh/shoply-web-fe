# Next.js Boilerplate

A production-ready Next.js starter with:

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS v4**
- **React Query v5** (TanStack Query)
- **Zustand v5**
- **Axios** (with interceptors)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/               # Next.js App Router pages & layouts
├── components/        # Reusable UI components
├── hooks/             # React Query hooks (e.g. usePosts.ts)
├── lib/
│   ├── axios.ts       # Axios instance with interceptors
│   └── react-query.tsx # QueryClient provider
├── services/          # API service functions (e.g. postsService.ts)
├── store/             # Zustand stores (counterStore, authStore)
└── types/             # Shared TypeScript types
```

## Environment Variables

Copy `.env.local` and update as needed:

```env
NEXT_PUBLIC_API_URL=https://your-api.com
```
