import { useState } from "react";
import { useListDonations, useCreateDonation, CreateDonationBodyDonationType, useListSupporters } from "@workspace/api-client-react";
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
import { Link } from "wouter";

const createDonationSchema = z.object({
  supporterId: z.coerce.number().optional().or(z.literal("")),
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
  currency: z.string().min(1, "Currency is required"),
  donationType: z.nativeEnum(CreateDonationBodyDonationType),
  campaign: z.string().optional(),
  channel: z.string().optional(),
  donatedAt: z.string().min(1, "Date is required"),
  receiptIssued: z.boolean().default(false),
  notes: z.string().optional()
});

export default function Donations() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryParams: any = { page, limit: 10 };
  if (search) queryParams.search = search;

  const { data: paginatedData, isLoading } = useListDonations({ query: queryParams });
  const { data: supporters } = useListSupporters({ query: { limit: 100 } });
  
  const createDonation = useCreateDonation();

  const form = useForm<z.infer<typeof createDonationSchema>>({
    resolver: zodResolver(createDonationSchema),
    defaultValues: {
      supporterId: "",
      amount: 0,
      currency: "USD",
      donationType: "online",
      campaign: "",
      channel: "website",
      donatedAt: new Date().toISOString().split('T')[0],
      receiptIssued: false,
      notes: ""
    }
  });

  const onSubmit = (data: z.infer<typeof createDonationSchema>) => {
    const payload = { ...data };
    if (payload.supporterId === "") delete payload.supporterId;

    createDonation.mutate({ data: payload as any }, {
      onSuccess: () => {
        toast({ title: "Donation logged successfully" });
        setIsDialogOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/admin/donations"] });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error logging donation",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-serif font-bold tracking-tight">Donations Log</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Log Donation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Log New Donation</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="supporterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supporter</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supporter (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Anonymous / Unknown</SelectItem>
                          {supporters?.data?.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
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
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="donationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Object.values(CreateDonationBodyDonationType).map(t => (
                              <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="donatedAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="campaign"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign</FormLabel>
                        <FormControl><Input placeholder="e.g. End of Year" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="channel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Channel</FormLabel>
                        <FormControl><Input placeholder="e.g. Website" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="mr-2">Cancel</Button>
                  <Button type="submit" disabled={createDonation.isPending}>Log Donation</Button>
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
                placeholder="Search donations..." 
                className="pl-8" 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Supporter</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Campaign</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>
                ) : !paginatedData?.data?.length ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10">No donations found.</TableCell></TableRow>
                ) : (
                  paginatedData.data.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell>{new Date(donation.donatedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">
                        {donation.supporterId ? (
                          <Link href={`/admin/donors/${donation.supporterId}`} className="text-primary hover:underline block">
                            {donation.supporterName}
                          </Link>
                        ) : (
                          "Anonymous"
                        )}
                      </TableCell>
                      <TableCell className="font-bold">{donation.currency} {donation.amount}</TableCell>
                      <TableCell className="capitalize">{donation.donationType.replace('_', ' ')}</TableCell>
                      <TableCell>{donation.campaign || "—"}</TableCell>
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