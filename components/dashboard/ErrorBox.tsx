// components/dashboard/ErrorBox.tsx
"use client";

export default function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
      Erreur&nbsp;: {message}
    </div>
  );
}
