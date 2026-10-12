import ts from "typescript";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync, readdirSync } from "node:fs";
import { dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { checkCoreBoundary } from "./check-core-boundary.mjs";

const licenseHash = "b495047bd93a9b06913511076f504daba17d5bbeb3e0650f3bb53a4220329c57";
const isFramework = name => /^(react|react-dom|vue|svelte|lucide-react)(\/|$)/.test(name);

export function verifyConsumerIsolation(root, framework) {
  const forbidden = framework === "core" ? ["react", "react-dom", "vue", "@types/react", "@types/react-dom", "lucide-react"]
    : framework === "vue" ? ["react", "react-dom", "@types/react", "@types/react-dom", "lucide-react"] : ["vue", "@vue/runtime-core"];
  const visited = new Set();
  function visit(modules) {
    if (!existsSync(modules)) return;
    modules = realpathSync(modules);
    if (visited.has(modules)) return;
    visited.add(modules);
    for (const name of forbidden) if (existsSync(resolve(modules, name, "package.json"))) throw new Error(`Unexpected installed ${name} in ${framework} consumer`);
    for (const entry of readdirSync(modules, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      if (entry.name.startsWith("@")) {
        for (const scoped of readdirSync(resolve(modules, entry.name))) visit(resolve(modules, entry.name, scoped, "node_modules"));
      } else visit(resolve(modules, entry.name, "node_modules"));
    }
  }
  visit(resolve(root, "node_modules"));
  return true;
}

export function verifyFrameworkBoundary(root) {
  root = realpathSync(root);
  const manifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  for (const name of Object.keys(manifest.dependencies ?? {})) if (isFramework(name)) throw new Error("Framework in package dependencies: " + name);
  if (createHash("sha256").update(readFileSync(resolve(root, "THIRD_PARTY_LICENSES/lucide.txt"))).digest("hex") !== licenseHash) throw new Error("Copied icon license missing or changed");
  const result = {};
  for (const [entry, framework] of [[".", "react"], ["./react", "react"], ["./vue", "vue"], ["./core", "core"]]) {
    const visited = new Set();
    const visit = file => {
      file = realpathSync(file);
      if (!relative(root, file).split(sep).join("/").startsWith("dist/")) throw new Error("Artifact dependency escapes dist");
      if (visited.has(file)) return;
      visited.add(file);
      const declaration = file.endsWith(".d.ts");
      const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
      if (source.referencedFiles.length || source.typeReferenceDirectives.length || source.libReferenceDirectives.length) throw new Error("Unexpected ambient reference");
      const dependency = specifier => {
        if (!specifier) throw new Error("Computed artifact import");
        if (!specifier.startsWith(".")) {
          const allowed = framework === "react" ? /^(react|react-dom|gridstack)(\/|$)/ : framework === "vue" ? /^(vue|gridstack)(\/|$)/ : /$a/;
          if (!allowed.test(specifier)) throw new Error(`${entry} imports forbidden ${specifier} in ${relative(root, file)}`);
          return;
        }
        const base = resolve(dirname(file), specifier);
        const candidates = declaration ? [base.replace(/\.js$/, "") + ".d.ts", base + ".d.ts", resolve(base, "index.d.ts"), base] : [base];
        const target = candidates.find(path => existsSync(path) && (declaration ? path.endsWith(".d.ts") : /\.m?js$/.test(path)));
        if (!target) throw new Error("Missing artifact dependency: " + specifier);
        visit(target);
      };
      function walk(node) {
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) dependency(ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : undefined);
        else if (ts.isImportTypeNode(node)) dependency(ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal) ? node.argument.literal.text : undefined);
        else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(node.expression) && node.expression.text === "require")) dependency(node.arguments[0] && ts.isStringLiteral(node.arguments[0]) ? node.arguments[0].text : undefined);
        else if (ts.isImportEqualsDeclaration(node)) throw new Error("Unexpected artifact import-equals");
        ts.forEachChild(node, walk);
      }
      walk(source);
    };
    for (const kind of ["import", "types"]) {
      const target = manifest.exports?.[entry]?.[kind];
      if (typeof target !== "string" || !target.startsWith("./dist/")) throw new Error("Missing public entry " + entry);
      visit(resolve(root, target));
    }
    result[entry] = visited.size;
  }
  checkCoreBoundary({ root, artifact: true });
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log("framework-boundary: passed", verifyFrameworkBoundary(resolve(process.argv[2] ?? "."))); }
  catch (error) { console.error("framework-boundary: failed\n" + error.message); process.exitCode = 1; }
}
