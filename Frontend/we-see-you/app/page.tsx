"use client";

import dynamic from "next/dynamic";

const PortalView = dynamic(() => import("@/components/portal/portal-view"), {
  ssr: false,
});

export default function Page() {
  return <PortalView />;
}
