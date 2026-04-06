import { useState } from "react";
import { 
  useListSafehouses, 
  useCreateSafehouse, 
  CreateSafehouseBodyStatus,
  useGetSafehouseComparison
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
import { Plus, Home, MapPin, Phone, Users } from "lucide-react";
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

const createSafehouseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  region: z.string().min(1, "Region is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().optional(),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  status: z.nativeEnum(CreateSafehouseBodyStatus),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
});

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    full: "bg-orange-100 text-orange-800",
  };
  return <Badge className={`${variants[status] || "bg-gray-100"} capitalize border-0`}>{status}</Badge>;
}

export default function Safehouses() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: safehouses, isLoading } = useListSafehouses();
  const { data: comparison } = useGetSafehouseComparison();
  
  const createSafehouse = useCreateSafehouse();

  const form = useForm<z.infer<typeof createSafehouseSchema>>({
    resolver: zodResolver(createSafehouseSchema),
    defaultValues: {
      name: "",
      region: "",
      city: "",
      address: "",
      capacity: 10,
      status: "active",
      contactPerson: "",
      contactPhone: "",
    }
  });

  const onSubmit = (data: z.infer<typeof createSafehouseSchema>) => {
    createSafehouse.mutate({ data: data as any }, {
      onSuccess: () => {
        toast({ title: "Safehouse created successfully" });
        setIsDialogOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/admin/safehouses"] });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error creating safehouse",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-serif font-bold tracking-tight">Safehouses</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Safehouse
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Safehouse</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Object.values(CreateSafehouseBodyStatus).map(s => (
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
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="mr-2">Cancel</Button>
                  <Button type="submit" disabled={createSafehouse.isPending}>Create Safehouse</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {comparison && comparison.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {comparison.map(comp => (
            <Card key={comp.safehouseId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  {comp.safehouseName}
                  <span className="text-sm font-normal text-muted-foreground">{comp.region}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Occupancy Rate</span>
                    <span className="font-medium">{comp.occupancyRate}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${comp.occupancyRate >= 90 ? 'bg-destructive' : comp.occupancyRate >= 75 ? 'bg-primary' : 'bg-green-500'}`} 
                      style={{ width: `${comp.occupancyRate}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-muted rounded-md p-2">
                    <div className="text-xl font-bold">{comp.reintegrationRate}%</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Reintegrated</div>
                  </div>
                  <div className="bg-muted rounded-md p-2">
                    <div className="text-xl font-bold">{comp.incidentRate}%</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Incidents</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>
              ) : !safehouses?.length ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10">No safehouses found.</TableCell></TableRow>
              ) : (
                safehouses.map((house) => {
                  const compData = comparison?.find(c => c.safehouseId === house.id);
                  const occupancy = compData ? Math.round((compData.occupancyRate / 100) * house.capacity) : 0;
                  
                  return (
                    <TableRow key={house.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          {house.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{house.city}</span>
                          <span className="text-xs text-muted-foreground flex items-center"><MapPin className="h-3 w-3 mr-1" />{house.region}</span>
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={house.status} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{occupancy} / {house.capacity}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {house.contactPerson && (
                          <div className="flex flex-col">
                            <span>{house.contactPerson}</span>
                            {house.contactPhone && <span className="text-xs text-muted-foreground flex items-center"><Phone className="h-3 w-3 mr-1" />{house.contactPhone}</span>}
                          </div>
                        )}
                        {!house.contactPerson && <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}