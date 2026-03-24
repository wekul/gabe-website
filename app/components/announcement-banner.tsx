type Props = {
  text: string;
};

export default function AnnouncementBanner({ text }: Props) {
  const message = text.trim();

  if (!message) {
    return null;
  }

  return (
    <div className="announcement-banner" role="status" aria-live="polite">
      <div className="announcement-banner-inner">
        <span className="announcement-banner-kicker">Announcement</span>
        <p className="announcement-banner-text">{message}</p>
      </div>
    </div>
  );
}
