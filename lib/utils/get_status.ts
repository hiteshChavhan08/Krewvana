import { AMASessionStatus } from "@prisma/client";

export const getStatusText = (status: AMASessionStatus): string => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };