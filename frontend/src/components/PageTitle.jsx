export default function PageTitle({ icon: Icon, title, description, iconClassName = 'bg-sky-50 text-sky-600' }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}>
        <Icon size={22} />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="text-slate-500 mt-1">{description}</p>}
      </div>
    </div>
  );
}
