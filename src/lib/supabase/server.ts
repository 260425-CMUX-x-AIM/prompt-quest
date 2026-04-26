import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// RSC / Route Handler / Server Action 에서 사용.
// 쿠키 set은 middleware가 전담하므로 try/catch로 무시 (RSC는 응답 쿠키 못 씀).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component 에서 set 호출 시 무시 — 토큰 갱신은 middleware 가 처리.
          }
        },
      },
    },
  );
}
