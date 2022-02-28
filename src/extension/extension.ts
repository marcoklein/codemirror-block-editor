import { ChangeSpec, EditorState, Extension } from "@codemirror/state";
import { dotWidgetViewPlugin } from "./dot-widget";
import {
  findBlockLevelCharacterIndentationOfLine,
  findBlockLevelOfLineNumberInDocument,
} from "./find-block-level-of-line";
import { handleChangeWithinBlockLevel } from "./handle-change-within-block-level";
import { blockLevelKeymap } from "./keymap";
import { dotTheme } from "./theme";

export const validateBlockIndentation = EditorState.transactionFilter.of(
  (transaction) => {
    const doc = transaction.state.doc; // TODO change to newDoc
    const changes: ChangeSpec[] = [];
    transaction.changes.iterChanges((fromA, toA, fromB, toB, text) => {
      const fromLine = doc.lineAt(fromA);
      const toLine = doc.lineAt(toB);

      for (
        let lineNumber = fromLine.number;
        lineNumber <= toLine.number;
        lineNumber++
      ) {
        const line = doc.line(lineNumber);
        const blockLevelOfLine = findBlockLevelCharacterIndentationOfLine(
          line.text
        );
        if (blockLevelOfLine <= 0) {
          const shouldBlockLevel = findBlockLevelOfLineNumberInDocument(
            doc,
            lineNumber
          );
          const numOfIndentationSpaces =
            line.text.length - line.text.trimLeft().length;
          const missingSpaces = shouldBlockLevel - numOfIndentationSpaces;
          if (missingSpaces > 0) {
            changes.push({
              from: line.from,
              insert: " ".repeat(missingSpaces),
            });
          }
        }
      }
    });

    return [transaction, { changes, sequential: true }];
  }
);

/**
 * Moves cursor out of block level indentation.
 *
 * Runs after the validation of block indentation as the curser might then be inside an indentation.
 */
const validateCursorPosition = EditorState.transactionFilter.of(
  (transaction) => {
    console.log("validate cursor position");
    const doc = transaction.newDoc; // TODO change to newDoc
    let selectionChange: { anchor: number; head: number } | undefined =
      undefined;

    for (const { head, anchor } of transaction.newSelection.ranges) {
      const headLine = doc.lineAt(head);
      const headBlockLevel = findBlockLevelOfLineNumberInDocument(
        doc,
        headLine.number
      );
      const headBlockEndIndex = headLine.from + headBlockLevel;

      const anchorLine = doc.lineAt(anchor);
      const anchorBlockLevel = findBlockLevelOfLineNumberInDocument(
        doc,
        anchorLine.number
      );
      const anchorBlockEndIndex = anchorLine.from + anchorBlockLevel;

      let newHead = head;
      let newAnchor = anchor;
      if (head <= headBlockEndIndex) {
        newHead = headBlockEndIndex;
      }
      if (anchor <= anchorBlockEndIndex) {
        newAnchor = anchorBlockEndIndex;
      }
      if (newHead !== head || newAnchor !== anchor) {
        selectionChange = {
          anchor: newAnchor,
          head: newHead,
        };
      }
    }

    return [transaction, { selection: selectionChange, sequential: true }];
  }
);

export function blockLevelExtension(_options: {} = {}): Extension {
  return [
    // TODO there is a bug that changes precedence -> have to change order of extensions with that patch
    dotWidgetViewPlugin,

    validateCursorPosition,
    validateBlockIndentation,

    handleChangeWithinBlockLevel,

    dotTheme,
    blockLevelKeymap,
  ];
}
