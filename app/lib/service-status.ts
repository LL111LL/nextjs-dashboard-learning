export const SERVICE_NAME =
  "nextjs-dashboard" as const;

export type ServiceStatus =
  | "ok"
  | "ready"
  | "unavailable";

export type CheckStatus = "up" | "down";

export type ServiceStatusPayload = {
  status: ServiceStatus;
  service: typeof SERVICE_NAME;
  checks: {
    application: "up";
    database?: CheckStatus;
  };
};

export function createServiceStatus(
  status: ServiceStatus,
  database?: CheckStatus,
): ServiceStatusPayload {
  return {
    status,
    service: SERVICE_NAME,
    checks: {
      application: "up",
      ...(database
        ? { database }
        : {}),
    },
  };
}