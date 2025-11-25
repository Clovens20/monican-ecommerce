'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // Skip check for login page
        if (pathname === '/admin/login') {
            setAuthorized(true);
            return;
        }

        const isAuth = localStorage.getItem('monican_admin_auth');
        if (!isAuth) {
            router.push('/admin/login');
        } else {
            setAuthorized(true);
        }
    }, [pathname, router]);

    // Show nothing while checking (or a loading spinner)
    if (!authorized) {
        return null;
    }

    return <>{children}</>;
}
