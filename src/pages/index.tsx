import type { ReactElement } from "react";
import UserLayout from "@components/templates/UserLayout";
import { UserHero } from "@components/organisms/UserHero/UserHero";
import { UserFeature } from "@components/organisms/UserFeature/UserFeature";
import { UserHowItWorks } from "@components/organisms/UserHowItWorks/UserHowItWorks";
import { UserRoleShowcase } from "@components/organisms/UserRoleShowcase/UserRoleShowcase";

function HomePage() {
  return (
    <div className="space-y-20 pb-8 lg:space-y-24 lg:pb-12">
      <UserHero />
      <UserFeature />
      <UserHowItWorks />
      <UserRoleShowcase />
    </div>
  );
}

HomePage.getLayout = function getLayout(page: ReactElement) {
  return <UserLayout title="Home">{page}</UserLayout>;
};

export default HomePage;
