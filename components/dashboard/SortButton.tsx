// components/dashboard/SortButton.tsx
"use client";

import clsx from "clsx";

type SortDir = "desc" | "asc";

export default function SortButton({
  label,
  active,
  dir,
  onClick,
  disabled,
  title,
}: {
  label: string;
  active: boolean;
  dir?: SortDir;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        "px-3 py-1.5 rounded-lg border text-sm transition",
        active
          ? "shadow-sm border-neutral-200 bg-neutral-900 text-white  hover:bg-neutral-800"
          : "border-neutral-600 bg-neutral-700 text-white hover:bg-neutral-600",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && <span aria-hidden="true">{dir === "desc" ? "▼" : "▲"}</span>}
      </span>
    </button>
  );
}
