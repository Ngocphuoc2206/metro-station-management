import Head from "next/head";

type Props = {
  title?: string;
  children?: React.ReactNode;
};

export const UserLayout = ({ title = "MetroNext", children }: Props) => {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div className="min-h-screen flex flex-col bg-slate-50">
        <header className="w-full border-b bg-white px-6 py-4 shadow-sm">
          <div className="mx-auto max-w-6xl font-semibold">MetroNext</div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
          {children}
        </main>

        <footer className="border-t bg-white px-6 py-4 text-sm text-gray-500">
          <div className="mx-auto max-w-6xl">MetroNext Frontend</div>
        </footer>
      </div>
    </>
  );
};
