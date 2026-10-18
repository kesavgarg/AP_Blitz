export const ONE_TIME_PATHS = [
  "/workspace/about",
  "/workspace/one-video",
  "/workspace/trends",
  "/workspace/send",
  "/workspace/commitment",
];

export function oneTimePathAllowed(pathname: string) {
  return ONE_TIME_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
