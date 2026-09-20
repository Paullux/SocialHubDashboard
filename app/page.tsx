// app/page.tsx
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import HomeContent from "@/components/home/HomeContent";
import JsonLd from "@/components/seo/JsonLd";

export default async function HomePage() {
  const { getPermission } = getKindeServerSession();
  const access = await getPermission("read:dashboard");
  const canSeeDashboard = !!access?.isGranted;

  return (
    <>
      <JsonLd />
      <HomeContent canSeeDashboard={canSeeDashboard} />
    </>
  );
}
