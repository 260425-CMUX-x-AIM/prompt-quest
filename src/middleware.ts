import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// (main) 그룹의 보호 라우트. /my-dojo 는 Day 8에 /me 로 변경 예정.
const PROTECTED_PREFIXES = ['/tasks', '/challenge', '/results', '/me', '/my-dojo'];
const AUTH_PREFIXES = ['/login'];

function matchesPrefix(path: string, prefixes: readonly string[]) {
  return prefixes.some((p) => path === p || path.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // RSC가 응답 쿠키를 못 쓰므로 middleware가 매 요청마다 토큰 갱신 책임.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (matchesPrefix(path, PROTECTED_PREFIXES) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (matchesPrefix(path, AUTH_PREFIXES) && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/tasks';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
