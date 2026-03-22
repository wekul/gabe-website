import Link from "next/link";

export default function Home() {
  return (
    <section className="home-page">
      <div>
        <p className="public-kicker">Studio Archive</p>
        <h1 className="home-page-text">Matthaus Addy</h1>
        <p className="public-copy">
          Artwork, objects, and digital editions presented with a quieter editorial structure.
          Browse current pieces, make purchase enquiries, or get in touch directly.
        </p>
        <div className="public-actions">
          <Link href="/shop" className="public-link">Enter Shop</Link>
          <Link href="/contact" className="public-link secondary">Contact</Link>
        </div>
      </div>
    </section>
  );
}
