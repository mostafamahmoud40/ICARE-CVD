export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center font-sans dark:bg-black">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        ICARE-CVD Frontend
      </h1>
      <p className="max-w-xl text-zinc-600 dark:text-zinc-400">
        Starter structure is ready with route groups and feature-based pages.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <a className="rounded-full bg-zinc-900 px-5 py-2 text-white dark:bg-zinc-100 dark:text-black" href="/login">
          Go to Login
        </a>
        <a className="rounded-full border border-zinc-300 px-5 py-2 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200" href="/prescriptions">
          Go to Prescriptions
        </a>
      </div>
    </main>
  );
}
