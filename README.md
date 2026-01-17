# DineAtHome Social

Production-ready starter for **DineAtHome Social** — “Home-hosted dining, made social.” (Next.js + TypeScript + MongoDB/Mongoose + JWT + Razorpay).

## Running locally

1) Install dependencies:

```bash
npm install
```

2) Create your env file (locally):

- Copy `docs/env.example` to `.env.local`
- Fill values (Mongo URI + JWT secrets + Razorpay keys)

3) Start dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Common mistake

If you run:

```bash
node run dev
```

Node will try to execute a file called `run` (which doesn’t exist), resulting in `Cannot find module .../run`.
Use `npm run dev` instead.

