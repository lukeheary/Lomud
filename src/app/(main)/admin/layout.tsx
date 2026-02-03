"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Building2, Shield, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const { data: adminCheck, isLoading: adminCheckLoading } =
        trpc.user.isAdmin.useQuery();
    const isAdmin = adminCheck?.isAdmin ?? false;

    if (adminCheckLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!isAdmin) {
        router.push("/");
        return null;
    }

    const navItems = [
        {
            label: "Overview",
            href: "/admin",
            icon: Shield,
        },
        {
            label: "Places",
            href: "/admin/places",
            icon: Building2,
        },
    ];

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="lg:w-1/5">
                    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                    pathname === item.href
                                        ? "bg-accent text-accent-foreground"
                                        : "text-muted-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </aside>
                <div className="flex-1">{children}</div>
            </div>
        </div>
    );
}
