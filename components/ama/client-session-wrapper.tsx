// components/ama/client-session-wrapper.tsx
"use client";

import { AMASessionData } from "@/types/types";
import dynamic from "next/dynamic";
// import type { AMASessionDetail } from "@/types"; // update to your actual type
import type { FC } from "react";

type Props = {
  session: AMASessionData;
  currentUser: any;
  sessionId: string;
};

const SessionUIWrapper = dynamic(() =>
  import("./session-ui-wrapper").then((mod) => mod.default), {
    ssr: false,
    loading: () => <div>Loading session details...</div>,
  }
);

const ClientSessionWrapper: FC<Props> = (props) => {
  return <SessionUIWrapper {...props} />;
};

export default ClientSessionWrapper;
