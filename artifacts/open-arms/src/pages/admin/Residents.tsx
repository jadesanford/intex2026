import { useState } from "react";
import { Link } from "wouter";
import { 
  useListResidents, 
  useListSafehouses,
  useCreateResident,
  CreateResidentBodyStatus,
  CreateResidentBodyRiskLevel
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
import { Plus, Search } from "lucide-react";
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

const createResidentSchema = z.object({
  caseCode: z.string().min(1, "Case code is required"),
  safehouseId: z.coerce.number().optional().or(z.literal("")),
  age: z.coerce.number().optional().or(z.literal("")),
  status: z.nativeEnum(CreateResidentBodyStatus),
  riskLevel: z.nativeEnum(CreateResidentBodyRiskLevel),
  caseCategory: z.string().optional(),
  referralSource: z.string().optional()
});

function RiskBadge({ level }: { level: string }) {
  const variants: Record<string, string> = {
    low: "bg-green-100 text-green-800 hover:bg-green-100",
    medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    high: "bg-orange-100 text-orange-800 hover:bg-orange-100",
    critical: "bg-red-100 text-red-800 hover:bg-red-100",
  };
  
  return (
    <Badge className={`${variants[level] || "bg-gray-100"} capitalize border-0`}>
      {level}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    active: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    reintegrated: "bg-green-100 text-green-800 hover:bg-green-100",
    transferred: "bg-purple-100 text-purple-800 hover:bg-purple-100",
    discharged: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  };

  return (
    <Badge className={`${variants[status] || "bg-gray-100"} capitalize border-0`}>
      {status}
    </Badge>
  );
}

export default function Residents() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: safehouses } = useListSafehouses();
  
  const queryParams: any = { page, limit: 10 };
  if (search) queryParams.search = search;
  if (statusFilter && statusFilter !== "all") queryParams.status = statusFilter;
  if (riskFilter && riskFilter !== "all") queryParams.riskLevel = riskFilter;

  const { data: paginatedData, isLoading } = useListResidents({ query: queryParams });
  
  const createResident = useCreateResident();

  const form = useForm<z.infer<typeof createResidentSchema>>({
    resolver: zodResolver(createResidentSchema),
    defaultValues: {
      caseCode: "",
      safehouseId: "",
      age: "",
      status: "active",
      riskLevel: "medium",
      caseCategory: "",
      referralSource: ""
    }
  });

  const onSubmit = (data: z.infer<typeof createResidentSchema>) => {
    // Clean up empty optional numbers
    const payload = { ...data };
    if (payload.safehouseId === "") delete payload.safehouseId;
    if (payload.age === "") delete payload.age;

    createResident.mutate({ data: payload as any }, {
      onSuccess: () => {
        toast({ title: "Resident created successfully" });
        setIsDialogOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/admin/residents"] });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error creating resident",
          description: "Something went wrong"
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-serif font-bold tracking-tight">Residents</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Resident
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Resident</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="caseCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. RES-2023-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 15" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(CreateResidentBodyStatus).map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="riskLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select risk level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(CreateResidentBodyRiskLevel).map(r => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
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
                  name="safehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Safehouse</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Assign safehouse (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
                          {safehouses?.map(sh => (
                            <SelectItem key={sh.id} value={sh.id.toString()}>{sh.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="caseCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case Category</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Trafficking" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="referralSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referral Source</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Police" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="mr-2">Cancel</Button>
                  <Button type="submit" disabled={createResident.isPending}>
                    {createResident.isPending ? "Creating..." : "Create Resident"}
                  </Button>
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
                placeholder="Search case code..." 
                className="pl-8" 
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex w-full md:w-auto gap-4">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="reintegrated">Reintegrated</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                  <SelectItem value="discharged">Discharged</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={riskFilter} onValueChange={(v) => { setRiskFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risks</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case Code</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Safehouse</TableHead>
                  <TableHead>Admitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground animate-pulse">
                      Loading residents...
                    </TableCell>
                  </TableRow>
                ) : !paginatedData?.data || paginatedData.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No residents found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.data.map((resident) => (
                    <TableRow key={resident.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <Link href={`/admin/residents/${resident.id}`} className="text-primary hover:underline block">
                          {resident.caseCode}
                        </Link>
                      </TableCell>
                      <TableCell>{resident.age || "—"}</TableCell>
                      <TableCell><StatusBadge status={resident.status} /></TableCell>
                      <TableCell><RiskBadge level={resident.riskLevel} /></TableCell>
                      <TableCell>{resident.safehouseName || "Unassigned"}</TableCell>
                      <TableCell>{resident.admissionDate ? new Date(resident.admissionDate).toLocaleDateString() : "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {paginatedData && paginatedData.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * paginatedData.limit) + 1} to Math.min(page * paginatedData.limit, paginatedData.total) of {paginatedData.total}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(paginatedData.totalPages, p + 1))}
                  disabled={page === paginatedData.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}