import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith("/login") || path.startsWith("/signup");
  const isPendingPage = path.startsWith("/pending");
  const isDashboard = path.startsWith("/dashboard");

  // Not logged in → send to login
  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged in on auth page → send to dashboard
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Logged in on dashboard → check approval
  if (user && isDashboard) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("approved")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.approved) {
      return NextResponse.redirect(new URL("/pending", request.url));
    }
  }

  // Approved user on pending page → send to dashboard
  if (user && isPendingPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("approved")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.approved) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/pending"],
};
