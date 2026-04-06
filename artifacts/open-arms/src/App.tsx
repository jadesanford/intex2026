import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { CookieConsent } from "@/components/CookieConsent";

// Pages
import Home from "@/pages/Home";
import Impact from "@/pages/Impact";
import Login from "@/pages/Login";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/not-found";

// Admin Pages
import AdminLayout from "@/components/layout/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import Residents from "@/pages/admin/Residents";
import ResidentDetail from "@/pages/admin/ResidentDetail";
import Donors from "@/pages/admin/Donors";
import DonorDetail from "@/pages/admin/DonorDetail";
import Donations from "@/pages/admin/Donations";
import Safehouses from "@/pages/admin/Safehouses";
import Partners from "@/pages/admin/Partners";
import Incidents from "@/pages/admin/Incidents";
import SocialMedia from "@/pages/admin/SocialMedia";
import Analytics from "@/pages/admin/Analytics";

const queryClient = new QueryClient();

function AdminRouter() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={Dashboard} />
        <Route path="/admin/residents" component={Residents} />
        <Route path="/admin/residents/:id" component={ResidentDetail} />
        <Route path="/admin/donors" component={Donors} />
        <Route path="/admin/donors/:id" component={DonorDetail} />
        <Route path="/admin/donations" component={Donations} />
        <Route path="/admin/safehouses" component={Safehouses} />
        <Route path="/admin/partners" component={Partners} />
        <Route path="/admin/incidents" component={Incidents} />
        <Route path="/admin/social-media" component={SocialMedia} />
        <Route path="/admin/analytics" component={Analytics} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/impact" component={Impact} />
      <Route path="/login" component={Login} />
      <Route path="/privacy" component={Privacy} />
      
      {/* Admin routes */}
      <Route path="/admin" component={AdminRouter} />
      <Route path="/admin/:rest*" component={AdminRouter} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
              <Router />
              <CookieConsent />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
