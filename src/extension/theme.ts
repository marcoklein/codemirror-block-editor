import { EditorView } from "@codemirror/basic-setup";

export const dotTheme = EditorView.baseTheme({
  ".cm-dot": {
    height: "1.3ch",
    width: "1.3ch",
    backgroundColor: "#bbb",
    borderRadius: "50%",
    display: "inline-block",
    cursor: "grab",
  },
  ".cm-dot:hover": {
    backgroundColor: "#000",
  },
});
