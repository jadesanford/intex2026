import { useGetAdminDashboardSummary, useGetAtRiskResidents } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Home, Heart, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading } = useGetAdminDashboardSummary();
  const { data: atRisk } = useGetAtRiskResidents();

  if (isLoading) {
    return <div className="animate-pulse space-y-4">Loading dashboard...</div>;
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif font-bold tracking-tight">Overview</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Residents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeResidents}</div>
            <p className="text-xs text-muted-foreground">+{summary.newResidentsThisMonth} this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Safehouses</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSafehouses}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Donations</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.monthlyDonationTotal}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.alertsHighRisk}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Safehouse Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.safehouses.map(sh => (
                <div key={sh.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{sh.name}</p>
                    <p className="text-sm text-muted-foreground">{sh.region}</p>
                  </div>
                  <div className="font-medium">{sh.currentOccupancy}/{sh.capacity}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.recentDonations.map(donation => (
                <div key={donation.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{donation.supporterName}</p>
                    <p className="text-sm text-muted-foreground">{new Date(donation.donatedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="font-medium">${donation.amount}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {atRisk && atRisk.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> At Risk Residents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {atRisk.map(r => (
                <div key={r.residentId} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <Link href={`/admin/residents/${r.residentId}`} className="font-medium hover:underline text-primary">
                      {r.caseCode}
                    </Link>
                    <p className="text-sm text-muted-foreground">{r.primaryRiskFactor}</p>
                  </div>
                  <div className="text-sm font-medium text-destructive">{r.riskLevel}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}