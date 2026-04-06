import { useState } from "react";
import { useRoute } from "wouter";
import {
  useGetResident,
  useUpdateResident,
  useDeleteResident,
  useListResidentSessions,
  useCreateResidentSession,
  useListResidentVisitations,
  useCreateResidentVisitation,
  useListResidentHealthRecords,
  useCreateResidentHealthRecord,
  useListResidentEducationRecords,
  useCreateResidentEducationRecord,
  useListResidentInterventions,
  useCreateResidentIntervention,
  useGetResidentRiskIndicators,
  ResidentStatus,
  ResidentRiskLevel
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ShieldAlert, Activity, BookOpen, HeartPulse, UserCircle, 
  MapPin, Calendar, Clock, AlertTriangle, CheckCircle2 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function RiskBadge({ level }: { level: string }) {
  const variants: Record<string, string> = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };
  return <Badge className={`${variants[level] || "bg-gray-100"} capitalize border-0`}>{level}</Badge>;
}

export default function ResidentDetail() {
  const [, params] = useRoute("/admin/residents/:id");
  const residentId = params?.id ? parseInt(params.id) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: resident, isLoading } = useGetResident(residentId, {
    query: { enabled: !!residentId, queryKey: ["/api/admin/residents", residentId] }
  });

  const { data: riskIndicators } = useGetResidentRiskIndicators(residentId, {
    query: { enabled: !!residentId, queryKey: ["/api/admin/residents", residentId, "risk"] }
  });

  const { data: sessions } = useListResidentSessions(residentId, {
    query: { enabled: !!residentId, queryKey: ["/api/admin/residents", residentId, "sessions"] }
  });

  const { data: visitations } = useListResidentVisitations(residentId, {
    query: { enabled: !!residentId, queryKey: ["/api/admin/residents", residentId, "visitations"] }
  });

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading resident profile...</div>;
  if (!resident) return <div className="p-8 text-center">Resident not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-serif font-bold tracking-tight">{resident.caseCode}</h1>
            <RiskBadge level={resident.riskLevel} />
            <Badge variant="outline" className="capitalize">{resident.status}</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {resident.safehouseName || "Unassigned"}</span>
            <span className="flex items-center gap-1"><UserCircle className="h-4 w-4" /> Age: {resident.age || "Unknown"}</span>
            {resident.admissionDate && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Admitted: {new Date(resident.admissionDate).toLocaleDateString()}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit Profile</Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risk">AI Risk Panel</TabsTrigger>
          <TabsTrigger value="sessions">Counseling</TabsTrigger>
          <TabsTrigger value="visitations">Visitations</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="overview" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Case Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="font-medium">{resident.caseCategory || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Referral Source</p>
                      <p className="font-medium">{resident.referralSource || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Reintegration Progress</p>
                      <p className="font-medium">{resident.reintegrationProgress ? `${resident.reintegrationProgress}%` : "Not started"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">General Notes</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">{resident.notes || "No notes available."}</p>
                  </div>
                </CardContent>
              </Card>

              {riskIndicators && (
                <Card className="border-orange-200">
                  <CardHeader className="bg-orange-50/50 pb-4">
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                      <ShieldAlert className="h-5 w-5" /> Risk Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Risk Score</span>
                      <span className="text-2xl font-bold text-orange-600">{riskIndicators.riskScore}/100</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Recommended Actions</p>
                      <ul className="space-y-2">
                        {riskIndicators.recommendedActions.slice(0, 3).map((action, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button variant="link" className="px-0 text-orange-600" onClick={() => document.querySelector('[data-value="risk"]')?.dispatchEvent(new MouseEvent('click', {bubbles: true}))}>
                      View full risk analysis &rarr;
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="risk" className="mt-0">
            {riskIndicators ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-orange-100 text-orange-600 mb-4">
                        <span className="text-3xl font-bold">{riskIndicators.riskScore}</span>
                      </div>
                      <h3 className="text-lg font-bold mb-1">Overall Risk Score</h3>
                      <p className="text-sm text-muted-foreground">Calculated based on recent activity, health records, and counselor notes.</p>
                      
                      <div className="mt-6 pt-6 border-t space-y-3 text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Regression Risk</span>
                          <Badge variant="outline">{riskIndicators.regressionRisk}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Reintegration</span>
                          <Badge variant="outline">{riskIndicators.reintegrationReadiness}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="md:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Analysis Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-red-600 flex items-center gap-2 mb-3">
                          <AlertTriangle className="h-4 w-4" /> Areas of Concern
                        </h4>
                        <ul className="space-y-2">
                          {riskIndicators.concernIndicators.map((indicator, i) => (
                            <li key={i} className="text-sm bg-red-50 text-red-900 p-2 rounded border border-red-100">{indicator}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-green-600 flex items-center gap-2 mb-3">
                          <Activity className="h-4 w-4" /> Positive Indicators
                        </h4>
                        <ul className="space-y-2">
                          {riskIndicators.positiveIndicators.map((indicator, i) => (
                            <li key={i} className="text-sm bg-green-50 text-green-900 p-2 rounded border border-green-100">{indicator}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-blue-600 flex items-center gap-2 mb-3">
                          <BookOpen className="h-4 w-4" /> Recommended Actions
                        </h4>
                        <ul className="space-y-2">
                          {riskIndicators.recommendedActions.map((action, i) => (
                            <li key={i} className="text-sm bg-blue-50 text-blue-900 p-2 rounded border border-blue-100">{action}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">No risk data available yet.</div>
            )}
          </TabsContent>

          <TabsContent value="sessions" className="mt-0">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Counseling Sessions</h3>
                <Button size="sm">Log Session</Button>
              </div>
              {sessions?.length ? (
                <div className="space-y-4">
                  {sessions.map(session => (
                    <Card key={session.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between mb-4">
                          <div className="space-y-1">
                            <div className="font-medium">{session.sessionType}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Clock className="h-3 w-3" /> {new Date(session.sessionDate).toLocaleDateString()}
                              <span>•</span> {session.counselorName}
                            </div>
                          </div>
                          <Badge variant="outline">{session.emotionalState}</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Notes:</span> {session.notes}</div>
                          {session.followUpActions && (
                            <div className="bg-muted p-2 rounded mt-2"><span className="font-medium">Follow-up:</span> {session.followUpActions}</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground">No sessions recorded yet.</div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="visitations" className="mt-0">
             <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Home Visitations</h3>
                <Button size="sm">Log Visit</Button>
              </div>
              {visitations?.length ? (
                <div className="space-y-4">
                  {visitations.map(visit => (
                    <Card key={visit.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between mb-4">
                          <div className="space-y-1">
                            <div className="font-medium">{visit.visitType}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Clock className="h-3 w-3" /> {new Date(visit.visitDate).toLocaleDateString()}
                              <span>•</span> {visit.visitorName}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Observations:</span> {visit.observations}</div>
                          {visit.safetyConcerns && (
                            <div className="text-destructive font-medium bg-destructive/10 p-2 rounded mt-2">Concerns: {visit.safetyConcerns}</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed rounded-lg text-muted-foreground">No visits recorded yet.</div>
              )}
            </div>
          </TabsContent>

          {/* Placeholders for other tabs for brevity */}
          <TabsContent value="health" className="mt-0 text-center py-12 border border-dashed rounded-lg text-muted-foreground">Health records implementation</TabsContent>
          <TabsContent value="education" className="mt-0 text-center py-12 border border-dashed rounded-lg text-muted-foreground">Education records implementation</TabsContent>
          <TabsContent value="interventions" className="mt-0 text-center py-12 border border-dashed rounded-lg text-muted-foreground">Intervention plans implementation</TabsContent>

        </div>
      </Tabs>
    </div>
  );
}