import { useEffect, useMemo, useState, type ReactElement } from "react";
import UserLayout from "@components/templates/UserLayout";
import { UserHero } from "@components/organisms/UserHero/UserHero";
import { UserFeature } from "@components/organisms/UserFeature/UserFeature";
import { UserHowItWorks } from "@components/organisms/UserHowItWorks/UserHowItWorks";
import { UserRoleShowcase } from "@components/organisms/UserRoleShowcase/UserRoleShowcase";
import { publicApi } from "@features/public/publicApi";



export default function HomePage() {
  const [landingCounts, setLandingCounts] = useState<{
    routes: number;
    stations: number;
    ticketTypes: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [routes, stations, ticketTypes] = await Promise.all([
          publicApi.getRoutes(),
          publicApi.getStations(),
          publicApi.getTicketTypes(),
        ]);
        if (cancelled) return;
        setLandingCounts({
          routes: routes.length,
          stations: stations.length,
          ticketTypes: ticketTypes.length,
        });
      } catch {
        // landing is still usable without this
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const statsText = useMemo(() => {
    if (!landingCounts) return undefined;
    return `Hiện có ${landingCounts.routes} tuyến · ${landingCounts.stations} nhà ga · ${landingCounts.ticketTypes} loại vé`;
  }, [landingCounts]);

  return (
    <div className="space-y-20 pb-8 lg:space-y-24 lg:pb-12">
      <UserHero statsText={statsText} />
      <UserFeature />
      <UserHowItWorks />
      <UserRoleShowcase />
    </div>
  );
}

HomePage.getLayout = function getLayout(page: ReactElement) {
  return <UserLayout title="Trang chủ">{page}</UserLayout>;
};
