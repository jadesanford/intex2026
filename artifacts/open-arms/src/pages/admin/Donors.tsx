import { useState } from "react";
import { Link } from "wouter";
import { 
  useListSupporters, 
  useGetLapsingDonors,
  useGetDonationSummary,
  useCreateSupporter,
  CreateSupporterBodyType
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
import { Plus, Search, AlertTriangle, TrendingUp, Users } from "lucide-react";
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

const createSupporterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  type: z.nativeEnum(CreateSupporterBodyType),
  country: z.string().optional(),
  city: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

export default function Donors() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryParams: any = { page, limit: 10 };
  if (search) queryParams.search = search;
  if (typeFilter && typeFilter !== "all") queryParams.type = typeFilter;

  const { data: paginatedData, isLoading } = useListSupporters({ query: queryParams });
  const { data: lapsingDonors } = useGetLapsingDonors();
  const { data: summary } = useGetDonationSummary();
  
  const createSupporter = useCreateSupporter();

  const form = useForm<z.infer<typeof createSupporterSchema>>({
    resolver: zodResolver(createSupporterSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      type: "individual",
      country: "",
      city: "",
      isRecurring: false,
    }
  });

  const onSubmit = (data: z.infer<typeof createSupporterSchema>) => {
    createSupporter.mutate({ data: data as any }, {
      onSuccess: () => {
        toast({ title: "Supporter created successfully" });
        setIsDialogOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/admin/supporters"] });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error creating supporter",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-serif font-bold tracking-tight">Donors & Supporters</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Supporter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Supporter</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name / Organization</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {Object.values(CreateSupporterBodyType).map(t => (
                            <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="mr-2">Cancel</Button>
                  <Button type="submit" disabled={createSupporter.isPending}>Create</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalDonors}</div>
              <p className="text-xs text-muted-foreground">{summary.recurringDonors} recurring</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.totalAmount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Donation</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summary.averageDonation}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {lapsingDonors && lapsingDonors.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-orange-600 flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5" /> At Risk of Lapsing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lapsingDonors.map(donor => (
                <div key={donor.supporterId} className="border rounded-lg p-4 bg-orange-50/50">
                  <div className="font-medium">{donor.supporterName}</div>
                  <div className="text-sm text-muted-foreground mt-1">{donor.daysSinceLastDonation} days since last donation</div>
                  <Badge variant="outline" className="mt-2 bg-white">{donor.riskLevel} risk</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search donors..." 
                className="pl-8" 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Supporter Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="foundation">Foundation</SelectItem>
                <SelectItem value="church">Church</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Total Donated</TableHead>
                  <TableHead>Donations</TableHead>
                  <TableHead>Last Donation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>
                ) : !paginatedData?.data?.length ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10">No donors found.</TableCell></TableRow>
                ) : (
                  paginatedData.data.map((supporter) => (
                    <TableRow key={supporter.id}>
                      <TableCell className="font-medium">
                        <Link href={`/admin/donors/${supporter.id}`} className="text-primary hover:underline block">
                          {supporter.name}
                        </Link>
                        {supporter.email && <div className="text-xs text-muted-foreground">{supporter.email}</div>}
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize">{supporter.type}</Badge></TableCell>
                      <TableCell>${supporter.totalDonated}</TableCell>
                      <TableCell>{supporter.donationCount}</TableCell>
                      <TableCell>{supporter.lastDonationDate ? new Date(supporter.lastDonationDate).toLocaleDateString() : "Never"}</TableCell>
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
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(paginatedData.totalPages, p + 1))} disabled={page === paginatedData.totalPages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}