import { useI18n } from "@/lib/i18n";
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function Privacy() {
  const { t, language } = useI18n();

  return (
    <PublicLayout>
      <div className="bg-secondary/30 py-12 md:py-20 border-b">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-center mb-6 text-foreground">
            {language === 'en' ? 'Privacy Policy' : 'Kebijakan Privasi'}
          </h1>
          <p className="text-xl text-muted-foreground text-center max-w-2xl mx-auto">
            {language === 'en' 
              ? 'How we protect and handle your sensitive information.' 
              : 'Bagaimana kami melindungi dan menangani informasi sensitif Anda.'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 max-w-3xl prose prose-slate">
        {language === 'en' ? (
          <>
            <h2>Introduction</h2>
            <p>
              At Open Arms, we are deeply committed to protecting the privacy and security of all individuals who interact with our organization, especially the survivors we serve. This Privacy Policy explains how we collect, use, and safeguard your information.
            </p>
            
            <h2>Survivor Information</h2>
            <p>
              The safety of the girls and women in our care is our highest priority. Any personal information collected during the intake, counseling, or residential process is strictly confidential.
            </p>
            <ul>
              <li>We use aliases or case codes in our general reporting.</li>
              <li>Access to resident data is restricted to authorized staff only.</li>
              <li>We never share identifiable survivor information with external parties without explicit, informed consent.</li>
            </ul>

            <h2>Donor and Supporter Information</h2>
            <p>
              When you make a donation or sign up for our newsletter, we collect necessary information to process your gift and keep you informed about our impact.
            </p>
            <ul>
              <li>We do not sell, trade, or rent your personal information to other organizations.</li>
              <li>Financial transactions are processed through secure, encrypted payment gateways.</li>
              <li>You may opt-out of our communications at any time.</li>
            </ul>

            <h2>Website Usage and Cookies</h2>
            <p>
              Our website uses basic cookies to improve your browsing experience. We track anonymous usage data to understand how visitors interact with our site and to improve our outreach efforts. No sensitive data is collected through casual website browsing.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have any questions or concerns about our privacy practices, please contact us through our secure contact form on the homepage.
            </p>
          </>
        ) : (
          <>
            <h2>Pengantar</h2>
            <p>
              Di Open Arms, kami sangat berkomitmen untuk melindungi privasi dan keamanan semua individu yang berinteraksi dengan organisasi kami, terutama para penyintas yang kami layani. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan menjaga informasi Anda.
            </p>
            
            <h2>Informasi Penyintas</h2>
            <p>
              Keselamatan anak perempuan dan perempuan dalam perawatan kami adalah prioritas tertinggi kami. Setiap informasi pribadi yang dikumpulkan selama proses penerimaan, konseling, atau residensial sangat rahasia.
            </p>
            <ul>
              <li>Kami menggunakan nama samaran atau kode kasus dalam pelaporan umum kami.</li>
              <li>Akses ke data penduduk dibatasi hanya untuk staf yang berwenang.</li>
              <li>Kami tidak pernah membagikan informasi penyintas yang dapat diidentifikasi kepada pihak luar tanpa persetujuan eksplisit.</li>
            </ul>

            <h2>Informasi Donatur dan Pendukung</h2>
            <p>
              Ketika Anda memberikan donasi atau mendaftar buletin kami, kami mengumpulkan informasi yang diperlukan untuk memproses hadiah Anda dan memberi tahu Anda tentang dampak kami.
            </p>
            <ul>
              <li>Kami tidak menjual, memperdagangkan, atau menyewakan informasi pribadi Anda kepada organisasi lain.</li>
              <li>Transaksi keuangan diproses melalui gateway pembayaran terenkripsi yang aman.</li>
              <li>Anda dapat memilih keluar dari komunikasi kami kapan saja.</li>
            </ul>

            <h2>Penggunaan Situs Web dan Cookie</h2>
            <p>
              Situs web kami menggunakan cookie dasar untuk meningkatkan pengalaman menjelajah Anda. Kami melacak data penggunaan anonim untuk memahami bagaimana pengunjung berinteraksi dengan situs kami dan untuk meningkatkan upaya penjangkauan kami. Tidak ada data sensitif yang dikumpulkan melalui penjelajahan situs web biasa.
            </p>

            <h2>Hubungi Kami</h2>
            <p>
              Jika Anda memiliki pertanyaan atau kekhawatiran tentang praktik privasi kami, silakan hubungi kami melalui formulir kontak aman kami di beranda.
            </p>
          </>
        )}
      </div>
    </PublicLayout>
  );
}