type Block =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'sub'; label: string; blocks: Block[] }

type PolicySection = {
  title: string
  blocks: Block[]
}

function renderBlocks(blocks: Block[], keyPrefix: string) {
  return blocks.map((b, i) => {
    const k = `${keyPrefix}-${i}`
    if (b.kind === 'p') {
      return (
        <p key={k} style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 12 }}>
          {b.text}
        </p>
      )
    }
    if (b.kind === 'ul') {
      return (
        <ul
          key={k}
          style={{
            color: 'var(--text-muted)',
            lineHeight: 1.75,
            marginBottom: 16,
            marginLeft: 20,
            paddingLeft: 8,
            listStyle: 'disc',
          }}
        >
          {b.items.map((item, j) => (
            <li key={j} style={{ marginBottom: 8 }}>
              {item}
            </li>
          ))}
        </ul>
      )
    }
    return (
      <div key={k} style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 8, fontSize: 15 }}>{b.label}</p>
        {renderBlocks(b.blocks, `${k}-sub`)}
      </div>
    )
  })
}

const t: Record<'en' | 'tl', { title: string; updated: string; sections: PolicySection[] }> = {
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: April 2026',
    sections: [
      {
        title: '1. Who We Are',
        blocks: [
          { kind: 'p', text: 'Open Arms is a nonprofit organization supporting survivors of sexual abuse and trafficking in the Philippines.' },
          { kind: 'p', text: 'Website: https://kind-field-092fa9b1e.7.azurestaticapps.net' },
          { kind: 'p', text: 'Contact: privacy@openarms.org' },
        ],
      },
      {
        title: '2. What Information We Collect',
        blocks: [
          { kind: 'p', text: 'We collect the following types of information:' },
          {
            kind: 'sub',
            label: 'a. Information You Provide',
            blocks: [
              {
                kind: 'ul',
                items: [
                  'Name and contact details (e.g., email) through forms',
                  'Donation-related information (excluding full payment details)',
                ],
              },
            ],
          },
          {
            kind: 'sub',
            label: 'b. Automatically Collected Information',
            blocks: [
              {
                kind: 'ul',
                items: [
                  'Basic technical data (IP address, browser type, device type)',
                  'Cookie and session data (for login and preferences)',
                ],
              },
            ],
          },
          {
            kind: 'sub',
            label: 'c. Sensitive Data',
            blocks: [
              {
                kind: 'p',
                text: 'We do NOT collect personally identifiable information about survivors or residents through the public website.',
              },
              { kind: 'p', text: 'All case-related data is:' },
              {
                kind: 'ul',
                items: ['Stored securely', 'Fully anonymized', 'Accessible only to authorized staff'],
              },
            ],
          },
        ],
      },
      {
        title: '3. Legal Basis for Processing (GDPR)',
        blocks: [
          { kind: 'p', text: 'We process your data under the following legal bases:' },
          {
            kind: 'ul',
            items: [
              'Consent – when you accept cookies or submit forms',
              'Legitimate Interest – to operate and improve our website',
              'Legal Obligation – for financial recordkeeping (donations)',
            ],
          },
        ],
      },
      {
        title: '4. How We Use Your Information',
        blocks: [
          { kind: 'p', text: 'We use your data to:' },
          {
            kind: 'ul',
            items: [
              'Respond to inquiries',
              'Process donations and issue receipts',
              'Maintain website functionality and security',
              'Improve user experience (only if consent is given for analytics)',
            ],
          },
          { kind: 'p', text: 'We do not sell or share your personal data with third parties.' },
        ],
      },
      {
        title: '5. Cookies and Tracking',
        blocks: [
          { kind: 'p', text: 'We use cookies in the following categories:' },
          {
            kind: 'sub',
            label: 'Essential Cookies (Always Active)',
            blocks: [
              {
                kind: 'ul',
                items: ['Authentication (login sessions)', 'Security', 'Consent preferences'],
              },
            ],
          },
          {
            kind: 'sub',
            label: 'Optional Cookies (Consent Required)',
            blocks: [{ kind: 'ul', items: ['Analytics or usage tracking (disabled by default)'] }],
          },
          { kind: 'p', text: 'You can accept or reject non-essential cookies via our cookie banner.' },
        ],
      },
      {
        title: '6. Data Sharing',
        blocks: [
          { kind: 'p', text: 'We may share limited data with:' },
          {
            kind: 'ul',
            items: ['Payment processors (for donations)', 'Hosting or infrastructure providers'],
          },
          { kind: 'p', text: 'All partners are required to follow strict data protection standards.' },
        ],
      },
      {
        title: '7. Data Retention',
        blocks: [
          { kind: 'p', text: 'We retain personal data only as long as necessary:' },
          {
            kind: 'ul',
            items: [
              'Contact form data: until inquiry is resolved',
              'Donation records: as required by law',
              'Analytics data: anonymized or deleted regularly',
            ],
          },
        ],
      },
      {
        title: '8. Data Security',
        blocks: [
          { kind: 'p', text: 'We implement industry-standard safeguards:' },
          {
            kind: 'ul',
            items: [
              'Encryption (HTTPS, data at rest)',
              'Access controls for sensitive systems',
              'Secure database practices',
            ],
          },
        ],
      },
      {
        title: '9. Your GDPR Rights',
        blocks: [
          { kind: 'p', text: 'If you are located in the EU, you have the right to:' },
          {
            kind: 'ul',
            items: [
              'Access your personal data',
              'Correct inaccurate data',
              'Request deletion ("right to be forgotten")',
              'Restrict processing',
              'Object to processing',
              'Request data portability',
            ],
          },
          { kind: 'p', text: 'To exercise your rights, contact: privacy@openarms.org' },
        ],
      },
      {
        title: '10. International Data Transfers',
        blocks: [
          {
            kind: 'p',
            text: 'Your data may be processed outside your country (e.g., United States or Philippines).',
          },
          {
            kind: 'p',
            text: 'We ensure appropriate safeguards are in place to protect your data.',
          },
        ],
      },
      {
        title: '11. Children’s Privacy',
        blocks: [
          { kind: 'p', text: 'We do not knowingly collect personal information from children under 13.' },
          {
            kind: 'p',
            text: 'All services for survivors are handled offline or through secure staff systems.',
          },
        ],
      },
      {
        title: '12. Changes to This Policy',
        blocks: [
          {
            kind: 'p',
            text: 'We may update this policy periodically. Updates will be posted on this page with a revised date.',
          },
        ],
      },
      {
        title: '13. Contact',
        blocks: [
          { kind: 'p', text: 'For privacy-related questions or requests:' },
          { kind: 'p', text: '📧 privacy@openarms.org' },
          { kind: 'p', text: '📍 Open Arms Philippines | Manila, Philippines' },
        ],
      },
    ],
  },
  tl: {
    title: 'Patakaran sa Privacy',
    updated: 'Huling na-update: Abril 2026',
    sections: [
      {
        title: '1. Sino Kami',
        blocks: [
          {
            kind: 'p',
            text: 'Ang Open Arms ay isang nonprofit na organisasyon na tumutulong sa mga nakaligtas sa sekswal na pang-aabuso at trafficking sa Pilipinas.',
          },
          { kind: 'p', text: 'Website: openarms.org' },
          { kind: 'p', text: 'Contact: privacy@openarms.org' },
        ],
      },
      {
        title: '2. Anong Impormasyon ang Kinokolekta Namin',
        blocks: [
          { kind: 'p', text: 'Kinokolekta namin ang mga sumusunod na uri ng impormasyon:' },
          {
            kind: 'sub',
            label: 'a. Impormasyong Ibinibigay Ninyo',
            blocks: [
              {
                kind: 'ul',
                items: [
                  'Pangalan at detalye ng pakikipag-ugnayan (hal. email) sa pamamagitan ng mga form',
                  'Impormasyon na may kinalaman sa donasyon (hindi kasama ang buong detalye ng bayad)',
                ],
              },
            ],
          },
          {
            kind: 'sub',
            label: 'b. Awtomatikong Kinokolektang Impormasyon',
            blocks: [
              {
                kind: 'ul',
                items: [
                  'Pangunahing teknikal na datos (IP address, uri ng browser, uri ng device)',
                  'Cookie at session data (para sa login at mga kagustuhan)',
                ],
              },
            ],
          },
          {
            kind: 'sub',
            label: 'c. Sensitibong Datos',
            blocks: [
              {
                kind: 'p',
                text: 'HINDI namin kinokolekta ang personal na impormasyon tungkol sa mga survivor o residente sa pamamagitan ng pampublikong website.',
              },
              { kind: 'p', text: 'Ang lahat ng datos na may kinalaman sa kaso ay:' },
              {
                kind: 'ul',
                items: [
                  'Ligtas na nakaimbak',
                  'Ganap na naka-anonymize',
                  'Naa-access lamang ng mga awtorisadong kawani',
                ],
              },
            ],
          },
        ],
      },
      {
        title: '3. Legal na Batayan sa Pagproseso (GDPR)',
        blocks: [
          { kind: 'p', text: 'Pinoproseso namin ang inyong datos batay sa mga sumusunod na legal na batayan:' },
          {
            kind: 'ul',
            items: [
              'Pahintulot (Consent) – kapag tinatanggap ninyo ang cookies o nagpapasa ng mga form',
              'Lehitimong Interes – upang patakbuhin at pagbutihin ang aming website',
              'Legal na Obligasyon – para sa pagtatala ng pinansyal (mga donasyon)',
            ],
          },
        ],
      },
      {
        title: '4. Paano Namin Ginagamit ang Inyong Impormasyon',
        blocks: [
          { kind: 'p', text: 'Ginagamit namin ang inyong datos upang:' },
          {
            kind: 'ul',
            items: [
              'Tumugon sa mga katanungan',
              'Iproseso ang mga donasyon at maglabas ng resibo',
              'Panatilihin ang paggana at seguridad ng website',
              'Pagbutihin ang karanasan ng gumagamit (lamang kung may pahintulot para sa analytics)',
            ],
          },
          {
            kind: 'p',
            text: 'Hindi namin ibinebenta o ibinabahagi ang inyong personal na datos sa mga third party.',
          },
        ],
      },
      {
        title: '5. Mga Cookie at Pagsubaybay',
        blocks: [
          { kind: 'p', text: 'Gumagamit kami ng cookies sa mga sumusunod na kategorya:' },
          {
            kind: 'sub',
            label: 'Mahahalagang Cookie (Laging Aktibo)',
            blocks: [
              {
                kind: 'ul',
                items: ['Authentication (mga session ng login)', 'Seguridad', 'Mga kagustuhan sa pahintulot'],
              },
            ],
          },
          {
            kind: 'sub',
            label: 'Opsyonal na Cookie (Kailangan ng Pahintulot)',
            blocks: [{ kind: 'ul', items: ['Analytics o pagsubaybay sa paggamit (naka-off bilang default)'] }],
          },
          {
            kind: 'p',
            text: 'Maaari ninyong tanggapin o tanggihan ang hindi mahahalagang cookie sa pamamagitan ng aming cookie banner.',
          },
        ],
      },
      {
        title: '6. Pagbabahagi ng Datos',
        blocks: [
          { kind: 'p', text: 'Maaari naming ibahagi ang limitadong datos sa:' },
          {
            kind: 'ul',
            items: [
              'Mga payment processor (para sa mga donasyon)',
              'Mga hosting o tagapagbigay ng imprastraktura',
            ],
          },
          {
            kind: 'p',
            text: 'Ang lahat ng kasosyo ay kinakailangang sumunod sa mahigpit na pamantayan sa proteksyon ng datos.',
          },
        ],
      },
      {
        title: '7. Pagpapanatili ng Datos',
        blocks: [
          { kind: 'p', text: 'Pinapanatili lamang namin ang personal na datos hangga’t kinakailangan:' },
          {
            kind: 'ul',
            items: [
              'Datos mula sa contact form: hanggang malutas ang katanungan',
              'Mga talaan ng donasyon: ayon sa batas',
              'Datos ng analytics: ina-anonymize o tinatanggal nang regular',
            ],
          },
        ],
      },
      {
        title: '8. Seguridad ng Datos',
        blocks: [
          { kind: 'p', text: 'Nagpapatupad kami ng mga karaniwang pamantayan sa seguridad:' },
          {
            kind: 'ul',
            items: [
              'Encryption (HTTPS, datos habang nakaimbak)',
              'Mga kontrol sa access para sa sensitibong sistema',
              'Ligtas na kasanayan sa database',
            ],
          },
        ],
      },
      {
        title: '9. Ang Inyong Mga Karapatan sa GDPR',
        blocks: [
          { kind: 'p', text: 'Kung kayo ay nasa EU, may karapatan kayong:' },
          {
            kind: 'ul',
            items: [
              'I-access ang inyong personal na datos',
              'Itama ang maling datos',
              'Humiling ng pagbura (“karapatang malimutan”)',
              'Limitahan ang pagproseso',
              'Tumutol sa pagproseso',
              'Humiling ng portability ng datos',
            ],
          },
          { kind: 'p', text: 'Para gamitin ang inyong mga karapatan, makipag-ugnayan sa: privacy@openarms.org' },
        ],
      },
      {
        title: '10. Pandaigdigang Paglipat ng Datos',
        blocks: [
          {
            kind: 'p',
            text: 'Ang inyong datos ay maaaring iproseso sa labas ng inyong bansa (hal. Estados Unidos o Pilipinas).',
          },
          {
            kind: 'p',
            text: 'Tinitiyak namin na may angkop na mga hakbang upang protektahan ang inyong datos.',
          },
        ],
      },
      {
        title: '11. Privacy ng mga Bata',
        blocks: [
          {
            kind: 'p',
            text: 'Hindi namin sinasadyang kinokolekta ang personal na impormasyon mula sa mga batang wala pang 13.',
          },
          {
            kind: 'p',
            text: 'Ang lahat ng serbisyo para sa mga survivor ay pinapatakbo offline o sa pamamagitan ng ligtas na sistema ng kawani.',
          },
        ],
      },
      {
        title: '12. Mga Pagbabago sa Patakarang Ito',
        blocks: [
          {
            kind: 'p',
            text: 'Maaari naming i-update ang patakarang ito paminsan-minsan. Ang mga update ay ipo-post sa pahinang ito na may bagong petsa.',
          },
        ],
      },
      {
        title: '13. Pakikipag-ugnayan',
        blocks: [
          { kind: 'p', text: 'Para sa mga tanong o kahilingan na may kinalaman sa privacy:' },
          { kind: 'p', text: '📧 privacy@openarms.org' },
          { kind: 'p', text: '📍 Open Arms Philippines | Maynila, Pilipinas' },
        ],
      },
    ],
  },
}

export default function Privacy({ lang }: { lang: 'en' | 'tl' }) {
  const tx = t[lang]
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px' }}>
      <h1 style={{ fontSize: 40, marginBottom: 8 }}>{tx.title}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 48 }}>{tx.updated}</p>
      {tx.sections.map((s) => (
        <section key={s.title} style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, marginBottom: 16, fontFamily: 'Inter, sans-serif', fontWeight: 600, color: 'var(--navy)' }}>
            {s.title}
          </h2>
          {renderBlocks(s.blocks, s.title)}
        </section>
      ))}
    </div>
  )
}
