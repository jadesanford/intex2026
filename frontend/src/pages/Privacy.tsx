const t = {
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: January 1, 2024',
    sections: [
      { title: 'Who We Are', content: 'Open Arms is a nonprofit organization supporting survivors of sexual abuse and trafficking in the Philippines. Our website address is openarms.org.' },
      { title: 'Information We Collect', content: 'We collect information you provide directly (contact forms, donation requests). We do not collect any personally identifiable information from survivors or residents. All case data is stored securely and anonymized.' },
      { title: 'How We Use Your Information', content: 'Contact information is used only to respond to your inquiries. Donation information is used to process contributions and issue receipts. We never sell or share your personal information with third parties.' },
      { title: 'Cookies', content: 'We use cookies to enhance your browsing experience. Essential cookies are required for the website to function. Analytics cookies help us understand how visitors use our site. You can opt out of non-essential cookies using our cookie consent banner.' },
      { title: 'Data Security', content: 'We implement industry-standard security measures to protect your information. All data is encrypted in transit and at rest. Access to sensitive case data is restricted to authorized staff only.' },
      { title: 'GDPR Rights', content: 'If you are in the EU, you have the right to access, correct, or delete your personal data. To exercise these rights, contact us at privacy@openarms.org.' },
      { title: 'Children\'s Privacy', content: 'We do not knowingly collect information from children under 13. Our services are provided to survivors through our staff portals, not directly online.' },
      { title: 'Contact', content: 'For privacy concerns, contact: privacy@openarms.org | Open Arms Philippines | Manila, Philippines' },
    ]
  },
  tl: {
    title: 'Patakaran sa Privacy',
    updated: 'Huling na-update: Enero 1, 2024',
    sections: [
      { title: 'Sino Kami', content: 'Ang Open Arms ay isang nonprofit na organisasyon na tumutulong sa mga nakaligtas sa sekswal na pang-aabuso at trafficking sa Pilipinas. Ang aming website ay openarms.org.' },
      { title: 'Impormasyong Kinokolekta Namin', content: 'Kinokolekta namin ang impormasyong direktang ibinibigay ninyo (mga form sa pakikipag-ugnayan, kahilingan sa donasyon). Hindi namin kinokolekta ang anumang personal na impormasyon mula sa mga nakaligtas o residente. Lahat ng datos ng kaso ay ligtas na nakaimbak at anonymous.' },
      { title: 'Paano Namin Ginagamit ang Inyong Impormasyon', content: 'Ang impormasyon sa pakikipag-ugnayan ay ginagamit lamang upang tumugon sa inyong mga katanungan. Ang impormasyon sa donasyon ay ginagamit upang maproseso ang mga kontribusyon. Hindi namin ibinebenta o ibinabahagi ang inyong personal na impormasyon sa mga third party.' },
      { title: 'Mga Cookie', content: 'Gumagamit kami ng cookies upang mapabuti ang inyong karanasan sa pagba-browse. Ang mahahalagang cookies ay kinakailangan para gumana ang website. Maaari kayong mag-opt out ng mga hindi mahahalagang cookies sa pamamagitan ng aming banner.' },
      { title: 'Seguridad ng Data', content: 'Nagpapatupad kami ng mga pamantayang pang-industriya na hakbang sa seguridad upang protektahan ang inyong impormasyon. Lahat ng datos ay naka-encrypt habang nasa transit at nakaimbak. Ang access sa sensitibong datos ng kaso ay limitado lamang sa mga awtorisadong kawani.' },
      { title: 'Pakikipag-ugnayan', content: 'Para sa mga alalahanin sa privacy, makipag-ugnayan sa: privacy@openarms.org | Open Arms Philippines | Manila, Pilipinas' },
    ]
  }
}

export default function Privacy({ lang }: { lang: 'en' | 'tl' }) {
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
