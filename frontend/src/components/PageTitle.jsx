export default function PageTitle({ icon: Icon, title, description, iconClassName = 'bg-primary-bg text-primary-text' }) {
  return (
    <div data-tour="page-title" className="flex items-start gap-3">
      <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}>
        <Icon size={22} />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        {description && <p className="text-text-muted mt-1">{description}</p>}
      </div>
    </div>
  );
}
