const t = {
  en: {
    title: 'Stories of Hope',
    subtitle:
      'Stories of courage, healing, and hope. Each journey reminds us that support, safety, and love can change lives.',
    storiesTitle: 'Stories of Hope',
    contactTitle: 'Share Your Story',
    contactText:
      'Want to share your story? Send it to us. With your permission, Open Arms will share your story to raise awareness and help others find Open Arms.',
    contactBtn: 'Contact Here',
  },
  tl: {
    title: 'Mga Kuwento ng Pag-asa',
    subtitle:
      'Mga kuwento ng tapang, paggaling, at pag-asa. Bawat paglalakbay ay paalala na ang suporta, kaligtasan, at pagmamahal ay kayang magbago ng buhay.',
    storiesTitle: 'Mga Kuwento ng Pag-asa',
    contactTitle: 'Ibahagi ang Iyong Kuwento',
    contactText:
      'Nais mo bang ibahagi ang iyong kuwento? Ipadala ito sa amin. Sa iyong pahintulot, ibabahagi ng Open Arms ang iyong kuwento upang magpalaganap ng kamalayan at makatulong sa iba na mahanap ang Open Arms.',
    contactBtn: 'Makipag-ugnayan Dito',
  },
}

const STORY_CARDS = [
  {
    title: 'A New Beginning',
    story:
      'After finding Open Arms, one young survivor entered a safe shelter, received trauma counseling, and slowly rebuilt trust. Today she is back in school and mentoring younger girls.',
    imageAlt: 'Young woman sharing her story',
    imageSrc: '/awareness-story-1.png',
  },
  {
    title: 'From Fear to Strength',
    story:
      'With consistent care, legal support, and compassionate guidance, another girl moved from fear and uncertainty to confidence. She now dreams of becoming a social worker.',
    imageAlt: 'Young woman outdoors sharing hope',
    imageSrc: '/awareness-story-2.png',
  },
  {
    title: 'Healing Through Community',
    story:
      'Through family reintegration planning and community support, a survivor found a stable path forward. Her story is a reminder that healing is possible when people walk together.',
    imageAlt: 'Group of girls supporting each other',
    imageSrc: '/awareness-story-3.png',
  },
]

export default function Awareness({ lang }: { lang: 'en' | 'tl' }) {
  const tx = t[lang]

  return (
    <div>
      <section
        style={{
          background: 'var(--beige)',
          padding: '75px 24px 60px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h1 className="impact-title" style={{ color: 'var(--navy)' }}>{tx.title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 18, lineHeight: 1.7 }}>{tx.subtitle}</p>
        </div>
      </section>

      <section style={{ padding: '0 24px 56px', marginTop: -44 }}>
        <div style={{ maxWidth: 1050, margin: '0 auto' }}>
          <div className="grid-3">
            {STORY_CARDS.map((item) => (
              <article key={item.title} className="card">
                <img
                  src={item.imageSrc}
                  alt={item.imageAlt}
                  style={{
                    width: '100%',
                    aspectRatio: '4 / 3',
                    objectFit: 'cover',
                    borderRadius: 12,
                    marginBottom: 14,
                  }}
                />
                <h3 style={{ fontSize: 19, marginBottom: 10 }}>{item.title}</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 15 }}>{item.story}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 24px 80px' }}>
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            borderRadius: 18,
            background: 'var(--navy)',
            color: 'white',
            padding: '42px 28px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
            <img
              src="/awareness-contact.png"
              alt="Girls together in a support circle"
              style={{
                flex: '1 1 240px',
                minWidth: 220,
                width: '100%',
                maxWidth: 320,
                aspectRatio: '4 / 3',
                objectFit: 'cover',
                borderRadius: 12,
              }}
            />
            <div style={{ flex: '2 1 360px', textAlign: 'left' }}>
              <h2 style={{ fontSize: 32, marginBottom: 12 }}>{tx.contactTitle}</h2>
              <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
                {tx.contactText}
              </p>
              <a
                href="mailto:info@openarms.org?subject=Share%20My%20Story%20for%20Awareness"
                className="btn btn-primary"
                style={{ fontSize: 16, padding: '12px 24px' }}
              >
                {tx.contactBtn}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
