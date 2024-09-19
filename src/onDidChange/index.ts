import {
  window,
  ExtensionContext,
  workspace,
  TextDocumentChangeEvent,
  TextEditor,
} from "vscode";
import { getDiagCache, setDiagCache } from "../diagnostics/util";
import { debounce } from "lodash";

/**
 * callbacks when document/active editor is changed
 * @param context
 */
export function registerDidChange(context: ExtensionContext, seveirty = 2) {
  // TODO: 预期当文件更改时重新parse整个文件， 因为单行add貌似会造成诊断的range错误？
  const updateDocument = (
    event: TextDocumentChangeEvent,
    context: ExtensionContext
  ) => {
    const editor = window.activeTextEditor;
    if (editor && seveirty != 0) {
      const diags = getDiagCache(context);
      // const position = editor.selection.active;
      const document = event.document;
      const documentText = document.getText();
      //const changedText = document.lineAt(position.line).text;
      if (diags && documentText) {
        // diags.addDiag(changedText);
        diags.parseFile();
        setDiagCache(context, diags);
      }
    }
  };
  const updateActiveEditor = (
    editor: TextEditor | undefined,
    context: ExtensionContext
  ) => {
    // TODO: 记得加入判断是否开启diag
    if (editor && seveirty != 0) {
      const diags = getDiagCache(context);
      if (diags) {
        const { isCached, path } = diags?.isCached();
        // add diags if not cached before
        if (!isCached) {
          diags.parseFile();
          setDiagCache(context, diags);
        }
      }
    }
  };
  // call after 1s
  const debouncedUpdateDocument = debounce(updateDocument, 1000);
  const debouncedUpdateActiveEditor = debounce(updateActiveEditor, 1000);
  let changeActiveEditor = window.onDidChangeActiveTextEditor((editor) => {
    debouncedUpdateActiveEditor(editor, context);
  });
  let changeDocument = workspace.onDidChangeTextDocument((event) => {
    debouncedUpdateDocument(event, context);
  });
  context.subscriptions.push(changeActiveEditor);
  context.subscriptions.push(changeDocument);
}
