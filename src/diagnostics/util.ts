import {
  Diagnostic,
  DiagnosticSeverity,
  Range,
  window,
  languages,
  ExtensionContext,
} from "vscode";
import { getCurFile } from "../utils";
import path from "path";

/**
 * return a new Diagnostic Instance
 * @param range - where diagnostic should be given
 */
export function getDiagnostic(
  range: Range,
  severity = DiagnosticSeverity.Warning
): Diagnostic {
  const diag = new Diagnostic(
    range,
    "The value of style property does not meet standards",
    severity
  );
  diag.source = "code actions for css";
  diag.code = 1;
  return diag;
}

/**
 * retrieve diags cache single instance
 * @param context
 * @param key
 * @returns
 */
export const getDiagCache: Getter<ExtensionContext, DiagnosticCache> = (
  context,
  key = "DiagnosticCache"
) => {
  return (context.workspaceState.get(key) as DiagnosticCache) || undefined;
};

/**
 * update diags cache single instance
 * @param context
 * @param load
 * @param key
 */
export const setDiagCache: Setter<
  ExtensionContext,
  DiagnosticCache | undefined
> = (context, load, key = "DiagnosticCache") => {
  context.workspaceState.update(key, load);
};

export class DiagnosticCache {
  private vals: string[];
  private pool: DiagnosticCachePool;
  private regexPattern: RegExp;
  private subscriptions: { dispose(): any }[];
  private severity: number;
  private severityMap: any[];
  private fullPaths: string[] | undefined;

  /**
   *
   * @param args vals: keysof variableMapprt, context: vscode Context
   */
  constructor(...args: any[]) {
    const [vals, subscriptions, severity, fullPaths] = args;
    this.vals = vals
      .filter((v: string) => v !== "")
      .map((color: string) =>
        color.replace(/\(/g, "\\(").replace(/\)/g, "\\)")
      );
    this.pool = {
      cachePool: Object.create({}),
      cachedPaths: new Set<string>(),
    };
    this.regexPattern = new RegExp(`(${this.vals.join("|")})`, "gi");
    this.severity = severity;
    this.severityMap = [
      undefined,
      DiagnosticSeverity.Information,
      DiagnosticSeverity.Warning,
      DiagnosticSeverity.Error,
    ];
    this.fullPaths = fullPaths;
    this.subscriptions = subscriptions;
  }

  /**
   * parse current actice file, create diagnostics collection, and cached it
   */
  parseFile() {
    const editor = window.activeTextEditor;
    let match;
    const matches = [];
    const filePath = path.dirname(editor?.document.uri.fsPath || "");
    if (
      editor &&
      this.fullPaths?.length &&
      filePath != "." &&
      !this.fullPaths.includes(filePath)
    ) {
      const document = editor.document;
      const text = document.getText();
      while ((match = this.regexPattern.exec(text)) !== null) {
        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + match[0].length);
        const range = new Range(startPos, endPos);
        matches.push({ range, text: match[0] });
      }
    }
    this.linkDiagnosticsCache(matches);
  }

  linkDiagnosticsCache(matches: { range: Range; text: string }[]) {
    if (matches.length) {
      const { path, uri } = getCurFile();
      // make sure cachepool is clear
      if (path && this.pool.cachePool[`${path}`]) {
        this.pool.cachePool[`${path}`]?.dispose();
        this.pool.cachePool = {
          ...this.pool.cachePool,
          ...{ [path]: undefined },
        };
      }
      const diagnosticCollection = languages.createDiagnosticCollection(
        `${path}`
      );
      const diagnostics: Diagnostic[] = matches.map((match) => {
        return getDiagnostic(match.range, this.severityMap[this.severity]);
      });
      uri && diagnosticCollection.set(uri, diagnostics);
      this.subscriptions.push(diagnosticCollection);
      // update pool
      if (path) {
        this.pool.cachedPaths = this.pool.cachedPaths.add(path);
        this.pool.cachePool = {
          ...this.pool.cachePool,
          ...{ [path]: diagnosticCollection },
        };
      }
    }
  }

  /**
   * determin if current file is cached
   */
  isCached() {
    const { path } = getCurFile();
    return { isCached: path && this.pool.cachedPaths.has(path), path };
  }

  /**
   * delete given diag when code action fixes it
   * @param range - diag所在范围
   */
  fixDiag(range: Range) {
    const { isCached, path } = this.isCached();
    if (isCached) {
      const { uri, path } = getCurFile();
      const diagCollection = uri && languages.getDiagnostics(uri);
      let diagnosticToKeep: Diagnostic[] | undefined;
      if (diagCollection && diagCollection.length) {
        diagnosticToKeep = diagCollection.filter(
          (d) => !d.range.isEqual(range)
        );
      }
      uri && this.pool.cachePool[`${path}`]?.set(uri, diagnosticToKeep);
    }
  }

  /**
   * add diagnostics of given text
   */
  addDiag(text: string) {
    const { isCached, path } = this.isCached();
    const matches = [];
    let match;
    const editor = window.activeTextEditor;
    if (isCached && editor) {
      const document = editor.document;
      while ((match = this.regexPattern.exec(text)) !== null) {
        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + match[0].length);
        const range = new Range(startPos, endPos);
        matches.push({ range, text: match[0] });
      }
      if (matches.length) {
        const { uri, path } = getCurFile();
        const diagCollection = uri && languages.getDiagnostics(uri);
        let diagnosticToKeep: Diagnostic[] | undefined;
        const diagnostics: Diagnostic[] = matches.map((match) => {
          return getDiagnostic(match.range);
        });
        if (diagCollection && diagCollection.length) {
          diagnosticToKeep = diagCollection.concat(diagnostics);
        }
        uri && this.pool.cachePool[`${path}`]?.set(uri, diagnosticToKeep);
      }
    }
  }

  /**
   * retrun inner attributes
   * @returns
   */
  resolveAttributes() {
    return { vals: this.vals, pool: this.pool };
  }
}
