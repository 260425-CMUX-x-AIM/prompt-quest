This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## AI Provider Switch

Switching between Claude and Gemini is controlled by env vars, not code changes.

```bash
AI_PROVIDER=claude
NEXT_PUBLIC_AI_PROVIDER=claude

# Claude
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Gemini
# GEMINI_API_KEY=...
# GEMINI_MODEL=gemini-2.5-flash

# Optional UI label override
NEXT_PUBLIC_AI_MODEL_LABEL=claude-sonnet-4-5
```

- Set `AI_PROVIDER` to `claude` or `gemini` for the server route.
- Set `NEXT_PUBLIC_AI_PROVIDER` to the same value so the challenge UI label matches.
- If you want a custom model label in the UI, set `NEXT_PUBLIC_AI_MODEL_LABEL`.
