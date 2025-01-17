import { VLSFormatConfig } from '../config';
import { MarkupContent, MarkupKind, Position } from 'vscode-languageserver';
import type { TextDocument } from 'vscode-languageserver-textdocument';
import { basename } from 'path';
import { RuntimeLibrary } from '../services/dependencyService';
import type ts from 'typescript';


/**
 * 获取当前光标前两个单词
 */
export function getPreviousWords(document: TextDocument, position: Position): string[] {
  const words = [], wordRule = /[\w-_]/;
  let word = '', newPos = { line: position.line, character: position.character - 1 };
  // 依次向上遍历
  for (let i = 0; i < 2; i++) {
    while (true) {
      const ch = charAt(document, newPos);
      newPos = {
        line: newPos.line,
        character: newPos.character - 1
      }
      if (!ch.match(wordRule)) {
        words.push(word);
        word = '';
        break;
      } else {
        word = ch + word
      }
    }
  }
  return words
}

export function getWordAtPostion(document: TextDocument, position: Position): string {

  let word = '';

  const wordRule = /[\w-_]/;
  // 依次向下遍历
  let newPos = position;
  while (true) {
    const ch = charAt(document, newPos);
    if (ch.match(wordRule)) word += ch;
    else break;
    newPos = {
      line: newPos.line,
      character: newPos.character + 1
    }
  }

  // 依次向上遍历
  newPos = {
    line: position.line,
    character: position.character - 1
  };
  while (true) {
    const ch = charAt(document, newPos);
    if (ch.match(wordRule)) word = ch + word;
    else break;
    newPos = {
      line: newPos.line,
      character: newPos.character - 1
    }
  }

  return word
}

function charAt(document: TextDocument, pos: Position, offset = 1) {
  try {
    return document.getText({
      start: pos,
      end: {
        line: pos.line,
        character: pos.character + offset
      }
    })
  } catch (error) {
    return '';
  }
}

export function getWordAtText(text: string, offset: number, wordDefinition: RegExp): { start: number; length: number } {
  let lineStart = offset;
  while (lineStart > 0 && !isNewlineCharacter(text.charCodeAt(lineStart - 1))) {
    lineStart--;
  }
  const offsetInLine = offset - lineStart;
  const lineText = text.slice(lineStart);

  // make a copy of the regex as to not keep the state
  const flags = wordDefinition.ignoreCase ? 'gi' : 'g';
  wordDefinition = new RegExp(wordDefinition.source, flags);

  let match = wordDefinition.exec(lineText);
  while (match && match.index + match[0].length < offsetInLine) {
    match = wordDefinition.exec(lineText);
  }
  if (match && match.index <= offsetInLine) {
    return { start: match.index + lineStart, length: match[0].length };
  }

  return { start: offset, length: 0 };
}

export function removeQuotes(str: string) {
  return str.replace(/["']/g, '');
}

const CR = '\r'.charCodeAt(0);
const NL = '\n'.charCodeAt(0);
function isNewlineCharacter(charCode: number) {
  return charCode === CR || charCode === NL;
}

const nonEmptyLineRE = /^(?!$)/gm;
/**
 *  wrap text in section tags like <template>, <style>
 *  add leading and trailing newline and optional indentation
 */
export function indentSection(text: string, options: VLSFormatConfig): string {
  const initialIndent = generateIndent(options);
  return text.replace(nonEmptyLineRE, initialIndent);
}

function generateIndent(options: VLSFormatConfig) {
  if (!options.options.useTabs) {
    return ' '.repeat(options.options.tabSize);
  } else {
    return '\t';
  }
}

export function toMarkupContent(value: string | MarkupContent | undefined) {
  if (!value) {
    return '';
  }

  return typeof value === 'string' ? { kind: MarkupKind.Markdown, value } : value;
}

// Convert module path to valid typescript identifier
// https://github.com/microsoft/TypeScript/blob/master/src/services/codefixes/importFixes.ts#L951
export function modulePathToValidIdentifier(
  tsModule: RuntimeLibrary['typescript'],
  modulePath: string,
  target: ts.ScriptTarget | undefined
): string {
  const baseName = basename(modulePath, '.vue');
  let res = '';
  let lastCharWasValid = true;
  const firstCharCode = baseName.charCodeAt(0);
  if (tsModule.isIdentifierStart(firstCharCode, target)) {
    res += String.fromCharCode(firstCharCode);
  } else {
    lastCharWasValid = false;
  }
  for (let i = 1; i < baseName.length; i++) {
    const ch = baseName.charCodeAt(i);
    const isValid = tsModule.isIdentifierPart(ch, target);
    if (isValid) {
      let char = String.fromCharCode(ch);
      if (!lastCharWasValid) {
        char = char.toUpperCase();
      }
      res += char;
    }
    lastCharWasValid = isValid;
  }

  return res;
}
