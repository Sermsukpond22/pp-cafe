import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'

// Routes accessible without login
const publicRoutes = ['/login', '/register']
// Routes only for admin and super_admin
const adminRoutes = ['/admin']
// Routes only for super_admin
const superAdminRoutes = ['/admin/manage-admins']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignore static public assets unconditionally
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname)) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get('session')?.value
  const session = await decrypt(sessionCookie)

  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))

  // Not logged in → redirect to login (except public routes)
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Already logged in → redirect away from auth pages
  if (session && isPublicRoute) {
    if (session.role === 'CUSTOMER') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // Super admin only routes
  if (superAdminRoutes.some((r) => pathname.startsWith(r))) {
    if (session?.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  // Admin routes — block customers
  if (adminRoutes.some((r) => pathname.startsWith(r))) {
    if (session?.role === 'CUSTOMER') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Customer routes — block admins
  if (!pathname.startsWith('/admin') && !isPublicRoute) {
    if (session?.role === 'ADMIN' || session?.role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
