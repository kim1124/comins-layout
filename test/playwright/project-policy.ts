export const DESKTOP_BROWSER_PROJECTS = [
  "chromium",
  "firefox",
  "webkit",
] as const;

export function isDesktopBrowserProject(projectName: string): boolean {
  return DESKTOP_BROWSER_PROJECTS.some((name) => name === projectName);
}
