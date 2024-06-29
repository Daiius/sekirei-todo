import clsx from 'clsx';

export default function Home() {
  return (
    <main className={clsx(
      "flex min-h-screen flex-col items-center justify-between p-24"
    )}>
      <div className={clsx(
        "z-10 w-full max-w-5xl items-center justify-between",
        "font-mono text-sm lg:flex"
      )}>
        <div>This is a test page of sekirei todo!</div>
      </div>
    </main>
  );
}
