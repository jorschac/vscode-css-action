import * as vscode from "vscode";
import { existsSync } from "fs";
import { join } from "path";
import tinycolor from "tinycolor2";
import { normalizeSizeValue, normalizeColorValue } from "./utils/index";
import { registerCommand } from "./commands";
import { ColorVarReplacer, PxReplacer } from "./codeActions";
import CssVariableManager from "./managers/CssVariableManager";
import {
  DiagnosticCache,
  getDiagCache,
  setDiagCache,
} from "./diagnostics/util";
import { registerDidChange } from "./onDidChange";
import { get } from "lodash";

let baseDir: string;
let variableMapper = new Map<string, Set<string>>();
let rootFontSize: number;
let pxReplaceOptions: string[];
let colorReplaceOptions: string[];
let valsInAllForms: Set<string> = new Set();
const manager = new CssVariableManager();

/**
 * create {values - Set(variables)} dictionary
 * @param fullPaths absolute paths to all variable definition files
 * @returns
 */

// TODO: 记得diag在fix之后是要删除的！
async function getVariablesMapper(fullPaths: string[]) {
  await manager.parseAndSyncVariables(fullPaths);
  const varMapper = new Map<string, Set<string>>();
  const cached = manager.getAll();

  for (let eachVar of cached.keys()) {
    let [varName, varValue] = [
      eachVar,
      get(cached.get(eachVar), "symbol.value", ""),
    ];
    let colorVal = normalizeColorValue(varValue);
    if (colorVal) {
      let _tnyColor = tinycolor(colorVal);
      valsInAllForms.add(_tnyColor.toHex8String());
      valsInAllForms.add(_tnyColor.toHexString());
      valsInAllForms.add(_tnyColor.toHslString());
      valsInAllForms.add(_tnyColor.toRgbString());
      valsInAllForms.add(_tnyColor.toName() || "");
      valsInAllForms.add(_tnyColor.toPercentageRgbString());
    }
    varValue = normalizeSizeValue(varValue) || colorVal || varValue || "";
    if (varName.startsWith("--")) varName = `var(${varName})`;
    if (!varMapper.get(varValue)) {
      varMapper.set(varValue, new Set());
    }
    varMapper.get(varValue)!.add(varName);
  }
  return varMapper;
}

async function init(context: vscode.ExtensionContext) {
  // make sure previous cache is clear
  setDiagCache(context, undefined);
  const workbenchConfig = vscode.workspace.getConfiguration("cssAction");
  // base directory to look for
  baseDir =
    workbenchConfig.get<string>("baseDir") ||
    vscode.workspace.name ||
    process.cwd();
  rootFontSize = workbenchConfig.get<number>("rootFontSize")!;
  pxReplaceOptions = workbenchConfig.get<string[]>("pxReplaceOptions")!;
  // template for color replace code diagnostic
  colorReplaceOptions = workbenchConfig.get<string[]>("colorReplaceOptions")!;
  // an array of paths to var files
  const variablesFilePaths = workbenchConfig
    .get<string>("variablesFile")
    ?.replace(/\s/g, "")
    .split(",");
  const seveirty = workbenchConfig.get<number>("severity");

  context.subscriptions.forEach((s) => s.dispose());

  if (variablesFilePaths?.length) {
    const fullPaths = variablesFilePaths.map((path) => {
      return join(baseDir, path);
    });
    for (let path of fullPaths) {
      if (!existsSync(path)) {
        vscode.window
          .showWarningMessage(
            `The path ${path} doesn\'t seem to exist, check path in your extension settings and restart VSCode`,
            "Extension Settings"
          )
          .then((input) => {
            if (typeof input === "string" && input === "Extension Settings") {
              vscode.commands.executeCommand("workbench.action.openSettings");
            }
          });
        return;
      }
    }
    manager.clearAllCache();

    variableMapper = await getVariablesMapper(fullPaths);

    /**
     * control if diag is on or not
     */
    // TODO: 记得加入判断是否开启diag
    if (variableMapper.size && seveirty != 0) {
      // TODO: 记得改
      const vals = [...valsInAllForms.values()];
      const diags = new DiagnosticCache(
        vals,
        context.subscriptions,
        seveirty,
        fullPaths
      );
      diags.parseFile();
      setDiagCache(context, diags);
    }

    const replacerParams = {
      rootFontSize,
      variableMapper,
      colorReplaceOptions,
      pxReplaceOptions,
    };

    context.subscriptions.push(
      vscode.languages.registerCodeActionsProvider(
        ColorVarReplacer.documentSelectors,
        new ColorVarReplacer(replacerParams),
        {
          providedCodeActionKinds: ColorVarReplacer.providedCodeActionKinds,
        }
      )
    );
    context.subscriptions.push(
      vscode.languages.registerCodeActionsProvider(
        PxReplacer.documentSelectors,
        new PxReplacer(replacerParams),
        {
          providedCodeActionKinds: PxReplacer.providedCodeActionKinds,
        }
      )
    );
    registerCommand(context, variableMapper);
    registerDidChange(context, seveirty);
  }
}

export async function activate(context: vscode.ExtensionContext) {
  await init(context);
}

export function deactivate(context: vscode.ExtensionContext) {
  context.subscriptions.forEach((s) => s.dispose());
}
