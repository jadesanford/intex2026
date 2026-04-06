import { useI18n } from "@/lib/i18n";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useGetPublicImpactSnapshot, useGetPublicDonationTrends, useGetPublicOutcomeMetrics, useGetPublicSafehouses } from "@workspace/api-client-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, Heart, Home } from "lucide-react";

export default function Impact() {
  const { t, language } = useI18n();
  const { data: snapshot } = useGetPublicImpactSnapshot();
  const { data: trends } = useGetPublicDonationTrends();
  const { data: outcomes } = useGetPublicOutcomeMetrics();
  const { data: safehouses } = useGetPublicSafehouses();

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const outcomeData = outcomes ? [
    { name: language === 'en' ? 'Reintegrated' : 'Direintegrasi', value: outcomes.reintegrated },
    { name: language === 'en' ? 'In Progress' : 'Dalam Proses', value: outcomes.inProgress },
    { name: language === 'en' ? 'High Risk' : 'Risiko Tinggi', value: outcomes.highRisk },
  ] : [];

  return (
    <PublicLayout>
      <div className="bg-secondary/30 py-12 md:py-20 border-b">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-center mb-6 text-foreground">
            {language === 'en' ? 'Our Impact' : 'Dampak Kami'}
          </h1>
          <p className="text-xl text-muted-foreground text-center max-w-2xl mx-auto">
            {language === 'en' 
              ? 'Transparency is core to our mission. See how your support translates into real change for survivors across Indonesia.' 
              : 'Transparansi adalah inti dari misi kami. Lihat bagaimana dukungan Anda menghasilkan perubahan nyata bagi para penyintas di seluruh Indonesia.'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 space-y-12">
        {/* Key Stats */}
        {snapshot && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{language === 'en' ? 'Total Helped' : 'Total Dibantu'}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{snapshot.totalResidentsHelped}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{language === 'en' ? 'Active Cases' : 'Kasus Aktif'}</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{snapshot.activeResidents}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{language === 'en' ? 'Safehouses' : 'Rumah Aman'}</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{snapshot.totalSafehouses}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{language === 'en' ? 'Reintegration' : 'Reintegrasi'}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{snapshot.reintegrationRate}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Donation Trends */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'en' ? 'Donation Trends' : 'Tren Donasi'}</CardTitle>
              <CardDescription>{language === 'en' ? 'Monthly support over time' : 'Dukungan bulanan dari waktu ke waktu'}</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {trends ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip cursor={{ stroke: 'hsl(var(--border))' }} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                    <Area type="monotone" dataKey="totalAmount" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary/10 rounded-lg animate-pulse" />
              )}
            </CardContent>
          </Card>

          {/* Outcome Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'en' ? 'Resident Outcomes' : 'Hasil Penduduk'}</CardTitle>
              <CardDescription>{language === 'en' ? 'Current status of all cases' : 'Status saat ini dari semua kasus'}</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              {outcomes ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={outcomeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {outcomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary/10 rounded-lg animate-pulse" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Map Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>{language === 'en' ? 'Our Safehouses' : 'Rumah Aman Kami'}</CardTitle>
            <CardDescription>{language === 'en' ? 'Locations across the region' : 'Lokasi di seluruh wilayah'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-[400px] bg-secondary/20 rounded-xl overflow-hidden border border-border/50 flex items-center justify-center">
              {/* Very simple abstract map representation */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
              
              <div className="relative w-full max-w-2xl h-full flex items-center justify-center">
                {safehouses?.map((house, idx) => {
                  // Distribute randomly for abstract view since we don't have real map tiles
                  const top = 20 + (idx * 15) % 60;
                  const left = 20 + (idx * 25) % 60;
                  
                  return (
                    <div 
                      key={house.id} 
                      className="absolute flex flex-col items-center group cursor-pointer"
                      style={{ top: `${top}%`, left: `${left}%` }}
                    >
                      <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-md z-10 animate-pulse"></div>
                      <div className="absolute top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg border whitespace-nowrap z-20 pointer-events-none">
                        <div className="font-bold">{house.name}</div>
                        <div>{house.city}, {house.region}</div>
                        <div>Cap: {house.currentOccupancy}/{house.capacity}</div>
                      </div>
                    </div>
                  );
                })}
                <div className="text-center relative z-0">
                  <MapPin className="h-16 w-16 text-primary/20 mx-auto mb-4" />
                  <p className="text-muted-foreground">{language === 'en' ? 'Interactive Map View' : 'Tampilan Peta Interaktif'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}