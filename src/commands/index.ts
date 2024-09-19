import * as vscode from "vscode";
import { getDiagCache, setDiagCache } from "../diagnostics/util";

async function showQuickPick(variableMapper: Map<string, Set<string>>) {
  const quickPick = vscode.window.createQuickPick();
  quickPick.matchOnDescription = true;
  quickPick.ignoreFocusOut = true;
  quickPick.placeholder = "Search var name and value";
  const options: vscode.QuickPickItem[] = [];
  variableMapper.forEach((values, key) => {
    options.push(
      ...Array.from(values).map((i) => ({ label: i, description: key }))
    );
  });

  quickPick.items = options;
  quickPick.onDidHide(() => quickPick.dispose());
  quickPick.show();

  quickPick.onDidChangeSelection((i) => {
    quickPick.hide();
    const selected = i[0];
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    const text = selected.label;
    editor.edit((textEditorEdit) =>
      editor.selections.forEach((selection) =>
        textEditorEdit.replace(selection, text)
      )
    );
  });
}

export function registerCommand(
  context: vscode.ExtensionContext,
  ...args: any[]
) {
  const [variableMapper] = args;
  context.subscriptions.push(
    vscode.commands.registerCommand("cssAction.pickVariable", () => {
      return showQuickPick(variableMapper);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cssAction.onDidExecute",
      (uri: vscode.Uri, range: vscode.Range) => {
        const diags = getDiagCache(context);
        if (diags) {
          diags.fixDiag(range);
          setDiagCache(context, diags);
        }
      }
    )
  );
}
