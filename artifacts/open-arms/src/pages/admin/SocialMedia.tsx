import { useState } from "react";
import { 
  useListSocialMediaPosts, 
  useCreateSocialMediaPost,
  CreateSocialMediaPostBodyPlatform
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Share2, Heart, MessageCircle, Repeat2, Eye } from "lucide-react";
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

const createPostSchema = z.object({
  platform: z.nativeEnum(CreateSocialMediaPostBodyPlatform),
  postDate: z.string().min(1, "Date is required"),
  content: z.string().min(1, "Content is required"),
  url: z.string().url("Invalid URL").optional().or(z.literal("")),
  campaign: z.string().optional(),
  impressions: z.coerce.number().default(0),
  likes: z.coerce.number().default(0),
  shares: z.coerce.number().default(0),
  comments: z.coerce.number().default(0)
});

export default function SocialMedia() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: posts, isLoading } = useListSocialMediaPosts();
  const createPost = useCreateSocialMediaPost();

  const form = useForm<z.infer<typeof createPostSchema>>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      platform: "instagram",
      postDate: new Date().toISOString().split('T')[0],
      content: "",
      url: "",
      campaign: "",
      impressions: 0,
      likes: 0,
      shares: 0,
      comments: 0
    }
  });

  const onSubmit = (data: z.infer<typeof createPostSchema>) => {
    createPost.mutate({ data: data as any }, {
      onSuccess: () => {
        toast({ title: "Post tracked successfully" });
        setIsDialogOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/admin/social-media"] });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error tracking post",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-serif font-bold tracking-tight">Social Media Tracking</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Track New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Track Social Media Post</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Object.values(CreateSocialMediaPostBodyPlatform).map(p => (
                              <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Post Date</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content / Caption</FormLabel>
                      <FormControl><Textarea {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post URL</FormLabel>
                      <FormControl><Input placeholder="https://" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="campaign"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign (Optional)</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-4 gap-2">
                  <FormField
                    control={form.control}
                    name="impressions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Impressions</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="likes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Likes</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Comments</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shares"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Shares</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="mr-2">Cancel</Button>
                  <Button type="submit" disabled={createPost.isPending}>Track Post</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['instagram', 'facebook', 'twitter', 'linkedin'].map(platform => {
          const platformPosts = posts?.filter(p => p.platform === platform) || [];
          const totalEngagement = platformPosts.reduce((sum, p) => sum + p.likes + p.shares + p.comments, 0);
          
          return (
            <Card key={platform}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium capitalize">{platform}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformPosts.length} <span className="text-sm font-normal text-muted-foreground">posts</span></div>
                <p className="text-xs text-muted-foreground mt-1">{totalEngagement} total engagements</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10">Loading...</TableCell></TableRow>
              ) : !posts?.length ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10">No posts tracked.</TableCell></TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{post.platform}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(post.postDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm line-clamp-2 max-w-md">{post.content}</span>
                        {post.campaign && <span className="text-xs text-primary mt-1">#{post.campaign}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1" title="Impressions"><Eye className="h-3 w-3" /> {post.impressions}</span>
                        <span className="flex items-center gap-1" title="Likes"><Heart className="h-3 w-3" /> {post.likes}</span>
                        <span className="flex items-center gap-1" title="Comments"><MessageCircle className="h-3 w-3" /> {post.comments}</span>
                        <span className="flex items-center gap-1" title="Shares"><Repeat2 className="h-3 w-3" /> {post.shares}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}