import tinycolor from "tinycolor2";
import { render } from "ejs";
import vscode from "vscode";

export enum BultinTemplateVar {
  remResult = "_REM_RESULT_",
  varName = "_VAR_NAME_",
  matchedText = "_MATCHED_TEXT_",
}

export function normalizeSizeValue(str: string) {
  const sizeReg = /\b\d+(px|rem|em)\b/g;
  const result = str.toLowerCase().match(sizeReg);
  if (result) {
    return result.join(" ");
  } else {
    return null;
  }
}

export function normalizeColorValue(str: string) {
  if (str) {
    const color = tinycolor(str);
    return color.isValid() ? tinycolor(str).toHex8String() : null;
  } else {
    return null;
  }
}

export function renderVarNamesTpl(
  tplString: string,
  varNames: Array<string>,
  context: any
) {
  return varNames.map((varName) => {
    return render(tplString, {
      [BultinTemplateVar.varName]: varName,
      ...context,
    });
  });
}

/**
 *
 * @param optionTpls ['<%= _VAR_NAME_ %>']
 * @param varNames {var(--main-bg-color), var(--main-text-color)}
 * @param context {_MATCHED_TEXT_: `${originText}`}
 * @returns
 */
export function renderOptions(
  optionTpls: string[],
  varNames: Set<string>,
  context: any
) {
  let result: string[] = [];
  for (const option of optionTpls) {
    if (option.includes(BultinTemplateVar.varName)) {
      result = result.concat(
        renderVarNamesTpl(option, Array.from(varNames), context)
      );
    } else {
      result.push(render(option, context));
    }
  }
  return result;
}

/**
 * get URI/absolute path of current file
 */
export function getCurFile() {
  const doc = vscode.window.activeTextEditor?.document;
  return {
    uri: doc?.uri,
    path: doc?.uri.fsPath,
  };
}
