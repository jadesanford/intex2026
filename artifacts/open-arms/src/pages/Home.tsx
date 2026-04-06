import { useI18n } from "@/lib/i18n";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useGetPublicImpactSnapshot, useSubmitContactForm } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Heart, Shield, Sun, ArrowRight, Phone } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  message: z.string().min(10, "Message is required"),
  isHelpRequest: z.boolean().default(false)
});

export default function Home() {
  const { t, language } = useI18n();
  const { data: impact } = useGetPublicImpactSnapshot();
  const submitForm = useSubmitContactForm();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      isHelpRequest: false
    }
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    submitForm.mutate({ 
      data: {
        ...data,
        language: language === 'en' ? 'en' : 'id'
      }
    }, {
      onSuccess: () => {
        toast({
          title: language === 'en' ? "Message Sent" : "Pesan Terkirim",
          description: language === 'en' ? "We will get back to you soon." : "Kami akan segera menghubungi Anda.",
        });
        form.reset();
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Something went wrong. Please try again later.",
        });
      }
    });
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative bg-secondary/30 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 md:px-6 pt-24 pb-32 relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-8 max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
              <Sun className="mr-2 h-4 w-4" />
              {t('hero.tagline')}
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-foreground leading-[1.1]">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
              {t('hero.desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="h-14 px-8 text-base rounded-full shadow-lg hover:shadow-xl transition-all" asChild>
                <a href="#help-form">
                  <Phone className="mr-2 h-5 w-5" />
                  {t('btn.getHelp')}
                </a>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full bg-white/50 backdrop-blur" asChild>
                <a href="#donate">{t('btn.donate')}</a>
              </Button>
            </div>
          </div>
          <div className="flex-1 relative hidden md:block">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-white shadow-2xl p-4 rotate-3 transform transition-transform hover:rotate-0 duration-500">
              <div className="w-full h-full bg-muted rounded-2xl overflow-hidden relative">
                {/* Fallback image placeholder if generate_image not used yet */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 flex items-center justify-center">
                  <Heart className="h-24 w-24 text-primary/30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Snapshot */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif font-bold mb-4">{language === 'en' ? 'Our Impact So Far' : 'Dampak Kami Sejauh Ini'}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {language === 'en' 
                ? 'Every number represents a life changed, a hope restored, and a future reclaimed.' 
                : 'Setiap angka mewakili kehidupan yang berubah, harapan yang dipulihkan, dan masa depan yang direbut kembali.'}
            </p>
          </div>
          
          {impact ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center p-8 rounded-2xl bg-secondary/20">
                <div className="text-4xl font-bold text-primary mb-2">{impact.totalResidentsHelped}</div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {language === 'en' ? 'Girls Helped' : 'Perempuan Dibantu'}
                </div>
              </div>
              <div className="text-center p-8 rounded-2xl bg-secondary/20">
                <div className="text-4xl font-bold text-primary mb-2">{impact.totalSafehouses}</div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {language === 'en' ? 'Safehouses' : 'Rumah Aman'}
                </div>
              </div>
              <div className="text-center p-8 rounded-2xl bg-secondary/20">
                <div className="text-4xl font-bold text-primary mb-2">{impact.reintegrationRate}%</div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {language === 'en' ? 'Reintegration Rate' : 'Tingkat Reintegrasi'}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center"><div className="h-32 w-full max-w-4xl bg-muted animate-pulse rounded-2xl"></div></div>
          )}
          
          <div className="text-center mt-12">
            <Button variant="link" asChild className="text-primary hover:text-primary/80">
              <Link href="/impact">
                {language === 'en' ? 'View Detailed Impact Report' : 'Lihat Laporan Dampak Rinci'} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Faith & Hope Section */}
      <section className="py-24 bg-primary text-primary-foreground text-center px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <Heart className="h-12 w-12 mx-auto opacity-80" />
          <h2 className="text-3xl md:text-4xl font-serif font-bold leading-tight">
            {language === 'en' 
              ? '"He heals the brokenhearted and binds up their wounds."' 
              : '"Ia menyembuhkan orang-orang yang patah hati dan membalut luka-luka mereka."'}
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            {language === 'en'
              ? 'Our work is driven by a deep conviction that every life is precious and capable of restoration. We provide unconditional love and support to those who need it most.'
              : 'Pekerjaan kami didorong oleh keyakinan mendalam bahwa setiap kehidupan berharga dan mampu dipulihkan. Kami memberikan cinta dan dukungan tanpa syarat kepada mereka yang paling membutuhkannya.'}
          </p>
        </div>
      </section>

      {/* Contact / Help Form */}
      <section id="help-form" className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="bg-secondary/30 rounded-3xl p-8 md:p-12 shadow-sm border">
            <div className="text-center mb-10">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-serif font-bold mb-4">
                {language === 'en' ? 'Reach Out to Us' : 'Hubungi Kami'}
              </h2>
              <p className="text-muted-foreground">
                {language === 'en' 
                  ? 'Whether you need help, want to refer someone, or have a question about our programs, we are here to listen. Your message is completely confidential.' 
                  : 'Baik Anda membutuhkan bantuan, ingin merujuk seseorang, atau memiliki pertanyaan tentang program kami, kami di sini untuk mendengarkan. Pesan Anda sepenuhnya rahasia.'}
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'en' ? 'Name (or Alias)' : 'Nama (atau Nama Samaran)'}</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" className="bg-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'en' ? 'Phone Number' : 'Nomor Telepon'}</FormLabel>
                        <FormControl>
                          <Input placeholder="+62..." className="bg-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'en' ? 'How can we help?' : 'Bagaimana kami bisa membantu?'}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={language === 'en' ? 'Tell us your situation safely...' : 'Ceritakan situasi Anda dengan aman...'} 
                          className="min-h-[120px] bg-white" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" size="lg" className="w-full rounded-full h-14 text-lg" disabled={submitForm.isPending}>
                  {submitForm.isPending 
                    ? (language === 'en' ? 'Sending...' : 'Mengirim...') 
                    : (language === 'en' ? 'Send Message Safely' : 'Kirim Pesan dengan Aman')}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}