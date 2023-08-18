import { workspace } from "vscode";

// https://code.visualstudio.com/api/language-extensions/embedded-languages
const virtualDocumentContents = new Map<string, string>();

export function bindEmbeddedContent() {
	workspace.registerTextDocumentContentProvider('embedded-content', {
		provideTextDocumentContent: uri => {
			// Remove leading `/` and ending `.css` to get original URI
			const originalUri = uri.path.slice(1).slice(0, -4);
			const decodedUri = decodeURIComponent(originalUri);
			return virtualDocumentContents.get(decodedUri);
		}
	});
}