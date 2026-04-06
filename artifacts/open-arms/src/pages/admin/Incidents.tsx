import { useState } from "react";
import { 
  useListIncidents, 
  useCreateIncident,
  CreateIncidentBodySeverity,
  useListResidents,
  useListSafehouses
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const createIncidentSchema = z.object({
  residentId: z.coerce.number().optional().or(z.literal("")),
  safehouseId: z.coerce.number().optional().or(z.literal("")),
  incidentDate: z.string().min(1, "Date is required"),
  incidentType: z.string().optional(),
  severity: z.nativeEnum(CreateIncidentBodySeverity),
  description: z.string().optional(),
  actionsTaken: z.string().optional(),
  reportedBy: z.string().optional(),
  resolved: z.boolean().default(false)
});

function SeverityBadge({ level }: { level: string }) {
  const variants: Record<string, string> = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };
  return <Badge className={`${variants[level] || "bg-gray-100"} capitalize border-0`}>{level}</Badge>;
}

export default function Incidents() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryParams: any = { page, limit: 10 };
  if (search) queryParams.search = search;
  if (severityFilter && severityFilter !== "all") queryParams.severity = severityFilter;

  const { data: incidents, isLoading } = useListIncidents({ query: queryParams });
  const { data: residents } = useListResidents({ query: { limit: 100 } });
  const { data: safehouses } = useListSafehouses();
  
  const createIncident = useCreateIncident();

  const form = useForm<z.infer<typeof createIncidentSchema>>({
    resolver: zodResolver(createIncidentSchema),
    defaultValues: {
      residentId: "",
      safehouseId: "",
      incidentDate: new Date().toISOString().split('T')[0],
      incidentType: "",
      severity: "medium",
      description: "",
      actionsTaken: "",
      reportedBy: "",
      resolved: false
    }
  });

  const onSubmit = (data: z.infer<typeof createIncidentSchema>) => {
    const payload = { ...data };
    if (payload.residentId === "") delete payload.residentId;
    if (payload.safehouseId === "") delete payload.safehouseId;

    createIncident.mutate({ data: payload as any }, {
      onSuccess: () => {
        toast({ title: "Incident reported successfully" });
        setIsDialogOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/admin/incidents"] });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error reporting incident",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-serif font-bold tracking-tight text-destructive flex items-center gap-2">
          <ShieldAlert className="h-8 w-8" />
          Incident Log
        </h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Plus className="mr-2 h-4 w-4" /> Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Report New Incident</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="incidentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Object.values(CreateIncidentBodySeverity).map(s => (
                              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="residentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Resident (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {residents?.data?.map(r => (
                              <SelectItem key={r.id} value={r.id.toString()}>{r.caseCode}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="safehouseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Safehouse (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {safehouses?.map(sh => (
                              <SelectItem key={sh.id} value={sh.id.toString()}>{sh.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="incidentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type of Incident</FormLabel>
                      <FormControl><Input placeholder="e.g. Medical, Security..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reportedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reported By</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="mr-2">Cancel</Button>
                  <Button type="submit" variant="destructive" disabled={createIncident.isPending}>Submit Report</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search incidents..." 
                className="pl-8" 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Related Entities</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>
                ) : !incidents?.length ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10">No incidents found.</TableCell></TableRow>
                ) : (
                  incidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="font-medium">
                        {new Date(incident.incidentDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{incident.incidentType || "Unspecified"}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{incident.description}</span>
                        </div>
                      </TableCell>
                      <TableCell><SeverityBadge level={incident.severity} /></TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          {incident.residentId ? (
                            <Link href={`/admin/residents/${incident.residentId}`} className="text-primary hover:underline">
                              Resident #{incident.residentId}
                            </Link>
                          ) : null}
                          {incident.safehouseId ? (
                            <span className="text-muted-foreground">Safehouse #{incident.safehouseId}</span>
                          ) : null}
                          {!incident.residentId && !incident.safehouseId && <span className="text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={incident.resolved ? "outline" : "destructive"}>
                          {incident.resolved ? "Resolved" : "Open"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}