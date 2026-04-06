const t = {
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: January 1, 2024',
    sections: [
      { title: 'Who We Are', content: 'Open Arms is a nonprofit organization supporting survivors of sexual abuse and trafficking in Indonesia. Our website address is openarms.org.' },
      { title: 'Information We Collect', content: 'We collect information you provide directly (contact forms, donation requests). We do not collect any personally identifiable information from survivors or residents. All case data is stored securely and anonymized.' },
      { title: 'How We Use Your Information', content: 'Contact information is used only to respond to your inquiries. Donation information is used to process contributions and issue receipts. We never sell or share your personal information with third parties.' },
      { title: 'Cookies', content: 'We use cookies to enhance your browsing experience. Essential cookies are required for the website to function. Analytics cookies help us understand how visitors use our site. You can opt out of non-essential cookies using our cookie consent banner.' },
      { title: 'Data Security', content: 'We implement industry-standard security measures to protect your information. All data is encrypted in transit and at rest. Access to sensitive case data is restricted to authorized staff only.' },
      { title: 'GDPR Rights', content: 'If you are in the EU, you have the right to access, correct, or delete your personal data. To exercise these rights, contact us at privacy@openarms.org.' },
      { title: 'Children\'s Privacy', content: 'We do not knowingly collect information from children under 13. Our services are provided to survivors through our staff portals, not directly online.' },
      { title: 'Contact', content: 'For privacy concerns, contact: privacy@openarms.org | Open Arms Indonesia | Jakarta, Indonesia' },
    ]
  },
  id: {
    title: 'Kebijakan Privasi',
    updated: 'Terakhir diperbarui: 1 Januari 2024',
    sections: [
      { title: 'Siapa Kami', content: 'Open Arms adalah organisasi nirlaba yang mendukung para penyintas kekerasan seksual dan perdagangan manusia di Indonesia.' },
      { title: 'Informasi yang Kami Kumpulkan', content: 'Kami mengumpulkan informasi yang Anda berikan secara langsung (formulir kontak, permintaan donasi). Kami tidak mengumpulkan informasi yang dapat diidentifikasi secara pribadi dari para penyintas atau penghuni.' },
      { title: 'Cara Kami Menggunakan Informasi Anda', content: 'Informasi kontak hanya digunakan untuk merespons pertanyaan Anda. Kami tidak pernah menjual atau berbagi informasi pribadi Anda kepada pihak ketiga.' },
      { title: 'Cookie', content: 'Kami menggunakan cookie untuk meningkatkan pengalaman penelusuran Anda. Cookie penting diperlukan agar situs web berfungsi dengan baik.' },
      { title: 'Keamanan Data', content: 'Kami menerapkan langkah-langkah keamanan standar industri untuk melindungi informasi Anda. Semua data dienkripsi dalam transit dan saat istirahat.' },
      { title: 'Kontak', content: 'Untuk masalah privasi, hubungi: privacy@openarms.org' },
    ]
  }
}

export default function Privacy({ lang }: { lang: 'en' | 'id' }) {
  const tx = t[lang]
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px' }}>
      <h1 style={{ fontSize: 40, marginBottom: 8 }}>{tx.title}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 48 }}>{tx.updated}</p>
      {tx.sections.map((s) => (
        <div key={s.title} style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>{s.title}</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>{s.content}</p>
        </div>
      ))}
    </div>
  )
}
