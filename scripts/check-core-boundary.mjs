import ts from "typescript";
import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const compilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  lib: ["lib.es2022.d.ts"],
  types: [],
  strict: true,
  skipLibCheck: false,
  noEmit: true,
};

/** Reject every external import, including type-only and transitive dependencies. */
export function checkCoreBoundary({ root = process.cwd(), artifact = false } = {}) {
  root = realpathSync(root);
  const entry = resolve(root, artifact ? "dist/core.d.ts" : "src/core.ts");
  const entries = artifact ? [entry, resolve(root, "dist/core.js")] : [entry];
  const visited = new Set();
  const visit = file => {
    file = realpathSync(file);
    if (visited.has(file)) return;
    const name = relative(root, file).split(sep).join("/");
    if (artifact ? !name.startsWith("dist/") : name !== "src/core.ts" && !name.startsWith("src/core/")) {
      throw new Error("Core dependency crosses its boundary: " + name);
    }
    visited.add(file);
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    if (source.referencedFiles.length || source.typeReferenceDirectives.length || source.libReferenceDirectives.length) {
      throw new Error("Core cannot add ambient references: " + name);
    }
    const dependency = specifier => {
      if (!specifier || !specifier.startsWith(".")) throw new Error("Core external or computed import in " + name);
      const direct = resolve(dirname(file), specifier);
      const target = file.endsWith(".js") && existsSync(direct)
        ? direct
        : ts.resolveModuleName(specifier, file, compilerOptions, ts.sys).resolvedModule?.resolvedFileName;
      if (!target) throw new Error("Unresolved Core dependency in " + name);
      visit(target);
    };
    const walk = node => {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier) dependency(ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : undefined);
      } else if (ts.isImportTypeNode(node)) {
        dependency(ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal) ? node.argument.literal.text : undefined);
      } else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(node.expression) && node.expression.text === "require")) {
        const argument = node.arguments[0];
        dependency(argument && ts.isStringLiteral(argument) ? argument.text : undefined);
      } else if (ts.isImportEqualsDeclaration(node)) {
        throw new Error("Core import-equals is forbidden in " + name);
      }
      ts.forEachChild(node, walk);
    };
    walk(source);
  };
  entries.forEach(visit);
  const program = ts.createProgram([entry], compilerOptions);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) {
    throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: file => file,
      getCurrentDirectory: () => root,
      getNewLine: () => "\n",
    }));
  }
  return { entry, files: visited.size };
}

export function checkBrowserBoundary({ root = process.cwd(), entries } = {}) {
  const visited = new Set();
  entries ??= [
    ...readdirSync(resolve(root, "src/browser")).filter(file => file.endsWith(".ts")).map(file => "src/browser/" + file),
    "example/src/browser-probe.ts",
  ];
  const visit = file => {
    if (visited.has(file)) return;
    visited.add(file);
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    if (source.referencedFiles.length || source.typeReferenceDirectives.length || source.libReferenceDirectives.length) throw new Error("Unexpected Browser ambient reference");
    const dependency = specifier => {
      if (!specifier) throw new Error("Computed Browser dependency");
      if (/^(react|react-dom|vue|svelte|lucide-react)(\/|$)/.test(specifier)) throw new Error("Framework dependency in Browser");
      if (specifier.endsWith(".css")) return;
      if (!specifier.startsWith(".")) {
        if (specifier !== "gridstack") throw new Error("Unexpected Browser dependency");
        return;
      }
      const target = ts.resolveModuleName(specifier, file, compilerOptions, ts.sys).resolvedModule?.resolvedFileName;
      if (!target) throw new Error("Unresolved Browser dependency");
      visit(target);
    };
    const walk = node => {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) dependency(node.moduleSpecifier.text);
      else if (ts.isImportTypeNode(node)) dependency(ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal) ? node.argument.literal.text : undefined);
      else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(node.expression) && node.expression.text === "require")) dependency(node.arguments[0] && ts.isStringLiteral(node.arguments[0]) ? node.arguments[0].text : undefined);
      else if (ts.isImportEqualsDeclaration(node)) throw new Error("Unexpected Browser import-equals");
      ts.forEachChild(node, walk);
    };
    walk(source);
  };
  entries.forEach(entry => visit(resolve(root, entry)));
  return { files: visited.size };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length && (args.length !== 2 || args[0] !== "--artifact")) throw new Error("Usage: check-core-boundary.mjs [--artifact directory]");
    const artifact = args[0] === "--artifact";
    const result = checkCoreBoundary({ root: artifact ? args[1] : process.cwd(), artifact });
    if (!artifact) checkBrowserBoundary();
    if (artifact) {
      const core = await import(pathToFileURL(resolve(args[1], "dist/core.js")).href);
      if (core.createDashboardLayoutState({ columns: 6, widgets: [] }).columns !== 6) throw new Error("Core runtime smoke failed");
    }
    console.log("core-boundary: passed (" + result.files + " files; " + result.entry + ")");
  } catch (error) {
    console.error("core-boundary: failed\n" + error.message);
    process.exitCode = 1;
  }
}
