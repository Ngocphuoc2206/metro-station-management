import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: "/passenger-page/my-tickets",
    permanent: false,
  },
});

export default function RecentTicketsRedirectPage() {
  return null;
}
