import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Heart,
  Home,
  ShieldAlert,
  BarChart3,
  LogOut,
  Menu,
  Briefcase,
  Share2
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { RequireAuth } from "@/lib/auth";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/residents", label: "Residents", icon: Users },
  { href: "/admin/donors", label: "Donors", icon: Heart },
  { href: "/admin/donations", label: "Donations", icon: BarChart3 },
  { href: "/admin/safehouses", label: "Safehouses", icon: Home },
  { href: "/admin/incidents", label: "Incidents", icon: ShieldAlert },
  { href: "/admin/partners", label: "Partners", icon: Briefcase },
  { href: "/admin/social-media", label: "Social Media", icon: Share2 },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

function AdminSidebar({ className = "" }: { className?: string }) {
  const [location] = useLocation();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/login";
      }
    });
  };

  return (
    <div className={`flex h-full flex-col bg-sidebar border-r ${className}`}>
      <div className="p-6">
        <Link href="/admin" className="flex items-center gap-2 font-serif text-xl font-bold text-primary">
          Open Arms
        </Link>
        <p className="text-xs text-muted-foreground mt-1 font-medium tracking-wider uppercase">Staff Portal</p>
      </div>

      <div className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}>
                <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background flex flex-col md:flex-row">
        {/* Mobile Nav */}
        <header className="md:hidden border-b bg-background sticky top-0 z-40 flex items-center justify-between px-4 h-16">
          <Link href="/admin" className="font-serif font-bold text-primary text-lg">
            Open Arms
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <AdminSidebar />
            </SheetContent>
          </Sheet>
        </header>

        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0 h-screen sticky top-0">
          <AdminSidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="hidden md:flex h-16 items-center px-8 border-b bg-background/95 backdrop-blur z-10 sticky top-0 justify-end">
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-muted-foreground">
                Welcome back, <span className="text-foreground">{user?.displayName || user?.username}</span>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}