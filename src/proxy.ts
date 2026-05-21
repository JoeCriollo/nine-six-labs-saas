import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const publicRoutes = ["/login"];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  // Use req.cookies directly instead of next/headers in middleware
  const sessionCookie = req.cookies.get("auth_session")?.value;

  try {
    if (!isPublicRoute && !sessionCookie) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    if (sessionCookie) {
      const secretKey = process.env.JWT_SECRET || "";
      const key = new TextEncoder().encode(secretKey);
      await jwtVerify(sessionCookie, key, { algorithms: ["HS256"] });
    }
    
    if (isPublicRoute && sessionCookie) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  } catch (error) {
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
  }

  return NextResponse.next();
}

// Configurar en qué rutas se debe ejecutar el middleware
export const config = {
  matcher: [
    /*
     * Intercepta todas las rutas excepto:
     * - api (API routes)
     * - _next/static (archivos estáticos de Next.js)
     * - _next/image (imágenes optimizadas de Next.js)
     * - favicon.ico, sitemap.xml, robots.txt, bg-login.png, etc.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|bg-login.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
