import { LanguageMode } from '../../embeddedSupport/languageModes';
import { SnippetManager, ScaffoldSnippetSources } from './snippets';
import { Range } from 'vscode-css-languageservice';
import { EnvironmentService } from '../../services/EnvironmentService';
import { CompletionItemKind } from 'vscode-languageserver-types';

export function getVueMode(env: EnvironmentService, globalSnippetDir?: string): LanguageMode {
  const snippetManager = new SnippetManager(env.getSnippetFolder(), globalSnippetDir);
  return {
    getId() {
      return 'vue';
    },
    doComplete(document, position) {
      const scaffoldSnippetSources: ScaffoldSnippetSources = env.getConfig().vetur.completion.scaffoldSnippetSources;

      if (
        scaffoldSnippetSources['workspace'] === '' &&
        scaffoldSnippetSources['user'] === '' &&
        scaffoldSnippetSources['vetur'] === ''
      ) {
        return { isIncomplete: false, items: [] };
      }

      const offset = document.offsetAt(position);
      const lines = document.getText().slice(0, offset).split('\n');
      const currentLine = lines[position.line];

      let items = snippetManager ? snippetManager.completeSnippets(scaffoldSnippetSources) : [];

      // If a line starts with `<`, it's probably a starting region tag that can be wholly replaced
      if (currentLine.length > 0 && currentLine.startsWith('<')) {
        // 优化style补全
        if (currentLine.includes('style')) {
          if (currentLine.match(/lang="$/)) {
            items = [
              { label: 'less', kind: CompletionItemKind.Field },
              { label: 'scss', kind: CompletionItemKind.Field },
              { label: 'sass', kind: CompletionItemKind.Field },
            ]
          } else {
            items = [
              { label: 'lang', kind: CompletionItemKind.Property },
              { label: 'scoped', kind: CompletionItemKind.Property }
            ]
          }
        } else {
          const replacementRange = Range.create(
            document.positionAt(offset - currentLine.length),
            document.positionAt(offset)
          );
          items.forEach(i => {
            if (i.insertText) {
              i.textEdit = {
                newText: i.insertText,
                range: replacementRange
              };
            }
          });
        }
      }

      return {
        isIncomplete: false,
        items
      };
    },
    onDocumentRemoved() { },
    dispose() { }
  };
}
