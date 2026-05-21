import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/actions/auth";
import { cookies } from "next/headers";

// Rutas que no requieren autenticación
const publicRoutes = ["/login"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  // Obtener el token de las cookies
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("auth_session")?.value;

  try {
    // Si la ruta no es pública y no hay sesión, redirigir al login
    if (!isPublicRoute && !sessionCookie) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    // Verificar el token si existe
    if (sessionCookie) {
      await decrypt(sessionCookie); // Lanza error si el token es inválido o expiró
    }
    
    // Si es una ruta pública y ya hay sesión válida, redirigir al home
    if (isPublicRoute && sessionCookie) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  } catch (error) {
    // Si la validación del token falla, redirigir al login
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
