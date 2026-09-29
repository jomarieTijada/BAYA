import { approvedMediaOrigins } from "./mediaOrigins";

export function isValidRemoteUrl(
  value: string,
  origins = approvedMediaOrigins,
): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      origins.includes(url.origin)
    );
  } catch {
    return false;
  }
}
