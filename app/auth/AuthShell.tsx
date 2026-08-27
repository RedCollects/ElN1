import Link from "next/link";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function AuthShell({ title, subtitle, children }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <Link
          href="/"
          className="text-sm font-bold uppercase tracking-widest text-sky-500"
        >
          EL N1
        </Link>
        <h1 className="mt-2 text-3xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-neutral-500">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}

export const inputClassName =
  "mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-sky-400";

export const labelClassName = "block text-sm font-bold";

export const primaryButtonClassName =
  "w-full rounded-xl bg-neutral-900 px-5 py-3 font-bold text-white disabled:opacity-50";
