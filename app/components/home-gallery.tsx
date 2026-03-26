import Image from "next/image";

type GalleryItem = {
  src: string;
  alt: string;
  title: string;
  details: string;
};

const HOME_STACK_IMAGES: GalleryItem[] = [
  {
    src: "https://img.matthausaddy.com/u/ZcmhXp.jpg",
    alt: "Homepage artwork 1",
    title: "Title",
    details: "Year made etc",
  },
  {
    src: "https://img.matthausaddy.com/u/28EaIt.jpg",
    alt: "Homepage artwork 2",
    title: "Title",
    details: "Year made etc",
  },
  {
    src: "https://img.matthausaddy.com/u/oTiapn.jpg",
    alt: "Homepage artwork 3",
    title: "Title",
    details: "Year made etc",
  },
  {
    src: "https://img.matthausaddy.com/u/rQE6pH.jpg",
    alt: "Homepage artwork 4",
    title: "Title",
    details: "Year made etc",
  },
];

const HOME_ROW_IMAGES: GalleryItem[] = [
  {
    src: "https://img.matthausaddy.com/u/4Wgs7c.jpg",
    alt: "Homepage artwork row 1",
    title: "Title",
    details: "Year made etc",
  },
  {
    src: "https://img.matthausaddy.com/u/9FCGky.jpg",
    alt: "Homepage artwork row 2",
    title: "Title",
    details: "Year made etc",
  },
  {
    src: "https://img.matthausaddy.com/u/1MgVss.jpg",
    alt: "Homepage artwork row 3",
    title: "Title",
    details: "Year made etc",
  },
];

const HOME_TRAILING_IMAGES: GalleryItem[] = [
  {
    src: "https://img.matthausaddy.com/u/C6QrHX.jpg",
    alt: "Homepage artwork continuation 1",
    title: "Title",
    details: "Year made etc",
  },
  {
    src: "https://img.matthausaddy.com/u/XEjjah.jpg",
    alt: "Homepage artwork continuation 2",
    title: "Title",
    details: "Year made etc",
  },
  {
    src: "https://img.matthausaddy.com/u/Z387jo.jpg",
    alt: "Homepage artwork continuation 3",
    title: "Title",
    details: "Year made etc",
  },
  {
    src: "https://img.matthausaddy.com/u/3pmBb7.jpg",
    alt: "Homepage artwork continuation 4",
    title: "Title",
    details: "Year made etc",
  },
  {
    src: "https://img.matthausaddy.com/u/SYHm14.jpg",
    alt: "Homepage artwork continuation 5",
    title: "Title",
    details: "Year made etc",
  },
  {
    src: "https://img.matthausaddy.com/u/J5KLi8.jpg",
    alt: "Homepage artwork continuation 6",
    title: "Title",
    details: "Year made etc",
  },
];

function ImageMetaCard({ title, details }: { title: string; details: string }) {
  return (
    <details className="home-gallery-meta" name="home-gallery-meta">
      <summary className="home-gallery-meta-summary">
        <span className="home-gallery-meta-title">{title}</span>
        <span className="home-gallery-meta-toggle">
          <span>More info</span>
          <span className="home-gallery-meta-chevron" aria-hidden="true">
            ^
          </span>
        </span>
      </summary>
      <div className="home-gallery-meta-details">{details}</div>
    </details>
  );
}

function GalleryFigure({ item, priority = false }: { item: GalleryItem; priority?: boolean }) {
  return (
    <div className="home-gallery-card">
      <figure className="home-gallery-figure">
        <Image
          src={item.src}
          alt={item.alt}
          width={1600}
          height={2200}
          sizes="(max-width: 900px) 100vw, 72rem"
          className="home-gallery-image"
          priority={priority}
        />
      </figure>
      <ImageMetaCard title={item.title} details={item.details} />
    </div>
  );
}

export default function HomeGallery() {
  return (
    <div className="home-gallery-layout">
      <div className="home-gallery-stack">
        {HOME_STACK_IMAGES.map((item, index) => (
          <GalleryFigure key={item.src} item={item} priority={index < 2} />
        ))}

        <div className="home-gallery-row-block">
          <div className="home-gallery-row">
            {HOME_ROW_IMAGES.map((item) => (
              <div key={item.src} className="home-gallery-card home-gallery-card-row">
                <figure className="home-gallery-figure home-gallery-figure-row">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={1200}
                    height={1600}
                    sizes="(max-width: 900px) 100vw, 33vw"
                    className="home-gallery-image"
                  />
                </figure>
              </div>
            ))}
          </div>
          <ImageMetaCard title="Title" details="Year made etc" />
        </div>

        {HOME_TRAILING_IMAGES.map((item) => (
          <GalleryFigure key={item.src} item={item} />
        ))}
      </div>
    </div>
  );
}
