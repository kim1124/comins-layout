import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { docsPages } from "../../example/src/docs/content";
import {
  compatibilityRoutes,
  playgroundPaths,
} from "../../example/src/playground/routes";

const repositoryRoot = process.cwd();
const repositoryUrl = "https://github.com/kim1124/comins-layout";
const rawRepositoryUrl = "https://raw.githubusercontent.com/kim1124/comins-layout/main";

const publicDocs = [
  "README.md",
  "docs/README.md",
  ...collectMarkdown("docs/user"),
  ...collectMarkdown("docs/ko"),
];

const activeDocs = [
  "CHANGELOG.md",
  "GUIDE.md",
  "README.md",
  "SECURITY.md",
  "THIRD_PARTY_NOTICES.md",
  ...collectMarkdown("docs", new Set(["superpowers"])),
  "test/README.md",
  "test/playwright/README.md",
  "test/playwright/specs/README.md",
  "test/vitest/README.md",
];

function collectMarkdown(directory: string, ignoredDirectories = new Set<string>()): string[] {
  const absoluteDirectory = join(repositoryRoot, directory);
  if (!existsSync(absoluteDirectory)) return [];

  return readdirSync(absoluteDirectory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        return ignoredDirectories.has(entry.name)
          ? []
          : collectMarkdown(path, ignoredDirectories);
      }
      return entry.isFile() && entry.name.endsWith(".md") ? [path] : [];
    })
    .sort();
}

function read(path: string) {
  return readFileSync(join(repositoryRoot, path), "utf8");
}

function markdownLinkTargets(markdown: string) {
  return [...markdown.matchAll(/\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/gu)]
    .map((match) => match[1])
    .filter((target): target is string => Boolean(target));
}

function markdownAnchors(markdown: string) {
  const anchors = new Set<string>();
  const duplicateCounts = new Map<string, number>();
  let fenced = false;

  for (const line of markdown.split("\n")) {
    if (/^\s*```/u.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;

    const heading = /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/u.exec(line)?.[1];
    if (!heading) continue;

    const base = heading
      .replace(/<[^>]+>/gu, "")
      .replace(/[`*_~]/gu, "")
      .toLocaleLowerCase("en-US")
      .trim()
      .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
      .replace(/\s/gu, "-");
    const duplicateCount = duplicateCounts.get(base) ?? 0;
    duplicateCounts.set(base, duplicateCount + 1);
    anchors.add(duplicateCount === 0 ? base : `${base}-${duplicateCount}`);
  }

  return anchors;
}

function localRepositoryTarget(target: string): { path: string; fragment?: string } | undefined {
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return undefined;
  }

  const fragment = url.hash ? decodeURIComponent(url.hash.slice(1)) : undefined;
  if (url.origin === new URL(repositoryUrl).origin) {
    const repositoryPrefix = "/kim1124/comins-layout/";
    if (!url.pathname.startsWith(repositoryPrefix)) return undefined;
    const repositoryPath = url.pathname.slice(repositoryPrefix.length);

    for (const prefix of ["blob/main/", "tree/main/"]) {
      if (repositoryPath.startsWith(prefix)) {
        return { path: decodeURIComponent(repositoryPath.slice(prefix.length)), fragment };
      }
    }

    const workflow = /^actions\/workflows\/([^/]+)(?:\/badge\.svg)?$/u.exec(repositoryPath)?.[1];
    if (workflow) return { path: `.github/workflows/${workflow}`, fragment };
    return undefined;
  }

  if (target.startsWith(`${rawRepositoryUrl}/`)) {
    return {
      path: decodeURIComponent(url.pathname.replace("/kim1124/comins-layout/main/", "")),
      fragment,
    };
  }

  return undefined;
}

function localMarkdownTarget(source: string, target: string) {
  const [pathPart, fragmentPart] = target.split("#", 2);
  const path = pathPart
    ? resolve(repositoryRoot, dirname(source), decodeURIComponent(pathPart))
    : resolve(repositoryRoot, source);
  return {
    path,
    fragment: fragmentPart ? decodeURIComponent(fragmentPart) : undefined,
  };
}

function expectResolvableTarget(source: string, targetPath: string, fragment?: string) {
  const absoluteTarget = resolve(repositoryRoot, targetPath);
  expect(
    relative(repositoryRoot, absoluteTarget).startsWith(".."),
    `${source} -> ${targetPath} must stay inside the repository`,
  ).toBe(false);
  expect(existsSync(absoluteTarget), `${source} -> ${targetPath}`).toBe(true);

  if (!fragment || !targetPath.endsWith(".md") || !existsSync(absoluteTarget)) return;
  expect(
    markdownAnchors(readFileSync(absoluteTarget, "utf8")).has(fragment),
    `${source} -> ${targetPath}#${fragment}`,
  ).toBe(true);
}

describe("active documentation links", () => {
  it("keeps local files, Markdown anchors, and same-repository GitHub targets resolvable", () => {
    for (const source of activeDocs) {
      for (const target of markdownLinkTargets(read(source))) {
        const repositoryTarget = localRepositoryTarget(target);
        if (repositoryTarget) {
          expectResolvableTarget(source, repositoryTarget.path, repositoryTarget.fragment);
          continue;
        }
        if (/^[a-z][a-z\d+.-]*:/iu.test(target) || target.startsWith("/")) continue;

        const localTarget = localMarkdownTarget(source, target);
        expectResolvableTarget(
          source,
          relative(repositoryRoot, localTarget.path),
          localTarget.fragment,
        );
      }
    }
  });

  it("does not publish clickable localhost links", () => {
    for (const source of publicDocs) {
      const localhostTargets = markdownLinkTargets(read(source)).filter((target) =>
        /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/iu.test(target),
      );
      expect(localhostTargets, source).toEqual([]);
    }
  });

  it("keeps documented public routes backed by the current example application", () => {
    const implementedRoutes = new Set([
      ...playgroundPaths,
      ...Object.keys(compatibilityRoutes),
      ...docsPages.map((page) => page.path),
    ]);

    for (const source of publicDocs) {
      const markdown = read(source);
      const documentedRoutes = [
        ...markdown.matchAll(/`(\/(?:docs|examples)\/[^`\s?]+|\/api)`/gu),
        ...markdown.matchAll(
          /`https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(\/(?:docs|examples)\/[^`\s?]+|\/api)`/gu,
        ),
      ]
        .map((match) => match[1])
        .filter((route): route is string => Boolean(route));
      for (const route of documentedRoutes) {
        expect(implementedRoutes.has(route), `${source} -> ${route}`).toBe(true);
      }
    }
  });

  it("keeps 0.2 patch documentation on the 0.2.x compatibility contract", () => {
    const readme = read("README.md");
    const english = [
      read("docs/user/03-widget-interactions-and-actions.md"),
      read("docs/user/09-lazy-rendering.md"),
      read("docs/user/11-engine-options.md"),
    ].join("\n");
    const korean = [
      read("docs/ko/03-widget-interactions-and-actions.md"),
      read("docs/ko/09-lazy-rendering.md"),
      read("docs/ko/11-engine-options.md"),
    ].join("\n");

    expect(readme).toContain("`0.2.x`");
    expect(english).toContain("`0.2.x`");
    expect(korean).toContain("`0.2.x`");
    expect([readme, english, korean].join("\n")).toContain("`0.3.0`");
  });
});
