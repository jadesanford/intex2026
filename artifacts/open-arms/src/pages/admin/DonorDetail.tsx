import { useState } from "react";
import { useRoute } from "wouter";
import {
  useGetSupporter,
  useGetSupporterLapseRisk,
  useListDonations,
  useUpdateSupporter,
  useDeleteSupporter,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, Phone, MapPin, Building, AlertTriangle, Heart } from "lucide-react";

export default function DonorDetail() {
  const [, params] = useRoute("/admin/donors/:id");
  const supporterId = params?.id ? parseInt(params.id) : 0;

  const { data: supporter, isLoading } = useGetSupporter(supporterId, {
    query: { enabled: !!supporterId, queryKey: ["/api/admin/supporters", supporterId] }
  });

  const { data: lapseRisk } = useGetSupporterLapseRisk(supporterId, {
    query: { enabled: !!supporterId, queryKey: ["/api/admin/supporters", supporterId, "lapse-risk"] }
  });

  const { data: donations } = useListDonations({
    query: { supporterId, limit: 50 }
  });

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading supporter profile...</div>;
  if (!supporter) return <div className="p-8 text-center">Supporter not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-serif font-bold tracking-tight">{supporter.name}</h1>
            <Badge variant="secondary" className="capitalize">{supporter.type}</Badge>
            {supporter.isRecurring && <Badge className="bg-primary hover:bg-primary">Recurring</Badge>}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            {supporter.email && <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {supporter.email}</span>}
            {supporter.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {supporter.phone}</span>}
            {(supporter.city || supporter.country) && (
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {[supporter.city, supporter.country].filter(Boolean).join(", ")}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Donation History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Campaign</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!donations?.data?.length ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-6">No donations found.</TableCell></TableRow>
                  ) : (
                    donations.data.map(donation => (
                      <TableRow key={donation.id}>
                        <TableCell>{new Date(donation.donatedAt).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">${donation.amount}</TableCell>
                        <TableCell className="capitalize">{donation.donationType.replace('_', ' ')}</TableCell>
                        <TableCell>{donation.campaign || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Giving Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Total Given</span>
                <span className="font-bold text-lg">${supporter.totalDonated}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Donation Count</span>
                <span className="font-medium">{supporter.donationCount}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Last Gift</span>
                <span className="font-medium">{supporter.lastDonationDate ? new Date(supporter.lastDonationDate).toLocaleDateString() : "—"}</span>
              </div>
            </CardContent>
          </Card>

          {lapseRisk && (
            <Card className={lapseRisk.riskLevel === "high" ? "border-red-200 bg-red-50/30" : lapseRisk.riskLevel === "medium" ? "border-orange-200 bg-orange-50/30" : ""}>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className={`h-5 w-5 ${lapseRisk.riskLevel === "high" ? "text-red-500" : lapseRisk.riskLevel === "medium" ? "text-orange-500" : "text-green-500"}`} />
                  Lapse Risk
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Risk Level</span>
                  <Badge variant="outline" className="capitalize bg-white">{lapseRisk.riskLevel}</Badge>
                </div>
                <div className="text-sm space-y-2">
                  <p><span className="text-muted-foreground">Days since last:</span> {lapseRisk.daysSinceLastDonation}</p>
                  <p><span className="text-muted-foreground">Avg gap:</span> {lapseRisk.averageDonationGap} days</p>
                </div>
                <div className="pt-4 border-t border-dashed">
                  <p className="text-sm font-medium mb-1">Recommendation:</p>
                  <p className="text-sm text-muted-foreground">{lapseRisk.recommendation}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}