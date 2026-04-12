import Head from "next/head";
import { UserHeader } from "@components/organisms/UserHeader/UserHeader";
import { UserFooter } from "@components/organisms/UserFooter/UserFooter";

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
        <UserHeader />

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
          {children}
        </main>

        <UserFooter />
      </div>
    </>
  );
};
