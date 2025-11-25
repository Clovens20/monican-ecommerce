import Sidebar from '@/components/admin/Sidebar';
import AdminGuard from '@/components/admin/AdminGuard';
import { Inter } from "next/font/google";
import "../globals.css"; // Reuse global styles but override layout

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fr">
            <body className={`${inter.variable}`} style={{ display: 'flex' }}>
                <AdminGuard>
                    <Sidebar />
                    <main style={{
                        marginLeft: '250px',
                        flexGrow: 1,
                        padding: '2rem',
                        backgroundColor: '#f9fafb',
                        minHeight: '100vh'
                    }}>
                        {children}
                    </main>
                </AdminGuard>
            </body>
        </html>
    );
}
