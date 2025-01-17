import fs from 'fs';
import path from 'path';
import { CompletionItem, InsertTextFormat, CompletionItemKind, MarkupContent } from 'vscode-languageserver-types';
import { logger } from '../../log';

type SnippetSource = 'workspace' | 'user' | 'vetur';
type SnippetType = 'file' | 'template' | 'style' | 'script' | 'custom';
interface Snippet {
  source: SnippetSource;
  name: string;
  type: SnippetType;
  customTypeName?: string;
  content: string;
}

export interface ScaffoldSnippetSources {
  workspace: string | undefined;
  user: string | undefined;
  vetur: string | undefined;
}

export class SnippetManager {
  private _snippets: Snippet[] = [];

  constructor(snippetFolder: string, globalSnippetDir?: string) {
    const workspaceSnippets = loadAllSnippets(snippetFolder, 'workspace');
    const userSnippets = globalSnippetDir ? loadAllSnippets(globalSnippetDir, 'user') : [];
    const veturSnippets = loadAllSnippets(path.resolve(__dirname, './veturSnippets'), 'vetur');

    this._snippets = [...workspaceSnippets, ...userSnippets, ...veturSnippets];
  }

  // Return all snippets in order
  completeSnippets(scaffoldSnippetSources: ScaffoldSnippetSources): CompletionItem[] {
    return this._snippets
      .filter(s => {
        return scaffoldSnippetSources[s.source] !== '';
      })
      .map(s => {
        let scaffoldLabelPre = '';
        const isTemplate = s.type == 'template';
        switch (s.type) {
          case 'file':
            scaffoldLabelPre = '<vue> with';
            break;
          case 'custom':
            scaffoldLabelPre = `<${s.customTypeName || 'custom'}> with`;
            break;
          case 'template':
          case 'style':
          case 'script':
            scaffoldLabelPre = `<${s.type}>`;
            break;
        }

        const label = isTemplate ? scaffoldLabelPre : `${scaffoldLabelPre} ${s.name.replace('.vue', '')}`;

        return <CompletionItem>{
          label,
          insertText: s.content,
          insertTextFormat: InsertTextFormat.Snippet,
          // Use file icon to indicate file/template/style/script/custom completions
          kind: isTemplate ? CompletionItemKind.Property : CompletionItemKind.File,
          documentation: computeDocumentation(s),
          detail: computeDetailsForFileIcon(s),
          sortText: computeSortTextPrefix(s) + label
        };
      });
  }
}

function loadAllSnippets(rootDir: string, source: SnippetSource): Snippet[] {
  let snippets = [
    ...loadSnippetsFromDir(rootDir, source, 'file'),
    ...loadSnippetsFromDir(path.resolve(rootDir, 'template'), source, 'template'),
    ...loadSnippetsFromDir(path.resolve(rootDir, 'style'), source, 'style'),
    ...loadSnippetsFromDir(path.resolve(rootDir, 'script'), source, 'script')
  ];

  try {
    fs.readdirSync(rootDir).forEach(p => {
      if (p === 'template' || p === 'style' || p === 'script') {
        return;
      }
      const absPath = path.resolve(rootDir, p);
      if (!absPath.endsWith('.vue') && fs.existsSync(absPath) && fs.lstatSync(absPath).isDirectory()) {
        const customDirSnippets = loadSnippetsFromDir(absPath, source, 'custom').map(s => {
          return {
            ...s,
            customTypeName: p
          };
        });

        snippets = [...snippets, ...customDirSnippets];
      }
    });
  } catch (err) {
    logger.logDebug((err as Error).message);
  }

  return snippets;
}

function loadSnippetsFromDir(dir: string, source: SnippetSource, type: SnippetType): Snippet[] {
  const snippets: Snippet[] = [];

  if (!fs.existsSync(dir)) {
    return snippets;
  }

  try {
    fs.readdirSync(dir)
      .filter(p => p.endsWith('.vue'))
      .forEach(p => {
        snippets.push({
          source,
          name: p,
          type,
          content: fs.readFileSync(path.resolve(dir, p), 'utf-8').replace(/\\t/g, '\t')
        });
      });
  } catch (err) {
    logger.logDebug((err as Error).message);
  }

  return snippets;
}

function computeSortTextPrefix(snippet: Snippet) {
  const s = {
    workspace: 0,
    user: 1,
    vetur: 2
  }[snippet.source];

  const t = {
    file: 'a',
    template: 'b',
    style: 'c',
    script: 'd',
    custom: 'e'
  }[snippet.type];

  return s + t;
}

function computeDetailsForFileIcon(s: Snippet) {
  switch (s.type) {
    case 'file':
      return s.name + ' | .vue';
    case 'template':
      return s.name + ' | .html';
    case 'style':
      return s.name + ' | .css';
    case 'script':
      return s.name + ' | .js';
    case 'custom':
      return s.name;
  }
}

function computeDocumentation(s: Snippet): MarkupContent {
  return {
    kind: 'markdown',
    value: `\`\`\`vue\n${s.content}\n\`\`\``
  };
}
