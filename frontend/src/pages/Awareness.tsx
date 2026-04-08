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
    contactImageAlt: 'Girls together in a support circle',
    contactMailSubject: 'Share My Story for Stories of Hope',
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
    contactImageAlt: 'Mga batang babae na magkasama sa isang bilog ng suporta',
    contactMailSubject: 'Ibahagi ang Aking Kuwento — Mga Kuwento ng Pag-asa',
  },
}

const STORY_CARDS = [
  {
    id: 'story-1',
    imageSrc: '/awareness-story-1.png',
    en: {
      title: 'A New Beginning',
      story:
        'After finding Open Arms, one young survivor entered a safe shelter, received trauma counseling, and slowly rebuilt trust. Today she is back in school and mentoring younger girls.',
      imageAlt: 'Young woman sharing her story',
    },
    tl: {
      title: 'Bagong Simula',
      story:
        'Matapos makahanap ang Open Arms, isang batang nakaligtas ay pumasok sa ligtas na tirahan, tumanggap ng konseling sa trauma, at unti-unting muling nagtiwala. Ngayon ay bumalik na siya sa paaralan at tumutulong sa mas batang babae.',
      imageAlt: 'Batang babae na nagbabahagi ng kanyang kuwento',
    },
  },
  {
    id: 'story-2',
    imageSrc: '/awareness-story-2.png',
    en: {
      title: 'From Fear to Strength',
      story:
        'With consistent care, legal support, and compassionate guidance, another girl moved from fear and uncertainty to confidence. She now dreams of becoming a social worker.',
      imageAlt: 'Young woman outdoors sharing hope',
    },
    tl: {
      title: 'Mula sa Takot tungo sa Lakas',
      story:
        'Sa tuloy-tuloy na pag-aalaga, legal na suporta, at mapagkalingang gabay, lumipat ang isa pang batang babae mula sa takot at kawalan ng katiyakan patungo sa tiwala sa sarili. Ngayon ay pangarap na niyang maging social worker.',
      imageAlt: 'Batang babae sa labas na nagbabahagi ng pag-asa',
    },
  },
  {
    id: 'story-3',
    imageSrc: '/awareness-story-3.png',
    en: {
      title: 'Healing Through Community',
      story:
        'Through family reintegration planning and community support, a survivor found a stable path forward. Her story is a reminder that healing is possible when people walk together.',
      imageAlt: 'Group of girls supporting each other',
    },
    tl: {
      title: 'Paggaling sa Pamamagitan ng Komunidad',
      story:
        'Sa pamamagitan ng plano sa muling pagsasama ng pamilya at suporta ng komunidad, nagkaroon ng matatag na landas pasulong ang isang nakaligtas. Ang kanyang kuwento ay paalala na posible ang paggaling kapag magkasama ang mga tao.',
      imageAlt: 'Grupo ng mga batang babae na nagtutulungan',
    },
  },
] as const

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
            {STORY_CARDS.map((item) => {
              const copy = item[lang]
              return (
                <article key={item.id} className="card">
                  <img
                    src={item.imageSrc}
                    alt={copy.imageAlt}
                    style={{
                      width: '100%',
                      aspectRatio: '4 / 3',
                      objectFit: 'cover',
                      borderRadius: 12,
                      marginBottom: 14,
                    }}
                  />
                  <h3 style={{ fontSize: 19, marginBottom: 10 }}>{copy.title}</h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 15 }}>{copy.story}</p>
                </article>
              )
            })}
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
              alt={tx.contactImageAlt}
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
                href={`mailto:info@openarms.org?subject=${encodeURIComponent(tx.contactMailSubject)}`}
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
