type Option = { id: string; label: string };

export function ViewToggle({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: Option[];
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <div className="seg" role="tablist" aria-label={label}>
      {options.map((option) => {
        const on = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={on}
            className={on ? "is-on" : undefined}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
