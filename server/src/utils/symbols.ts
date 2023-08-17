import type { TextDocument } from 'vscode-languageserver-textdocument';
import { LanguageModes } from '../embeddedSupport/languageModes';
import { Position, SymbolInformation } from 'vscode-languageserver';
import { getWordAtPostion } from './strings';
import { SymbolKind } from 'vscode-languageserver-types';

export function collectSymbols(languageModes: LanguageModes, doc: TextDocument): SymbolInformation[] {
    const symbols: SymbolInformation[] = []
    languageModes.getAllLanguageModeRangesInDocument(doc).forEach(m => {
        if (m.mode.findDocumentSymbols) {
            symbols.push.apply(symbols, m.mode.findDocumentSymbols(doc));
        }
    });
    return symbols;
}

export function trimQuote(str: string) {
    if (typeof str != 'string') return str;
    return str.replace(/(^['"]|['"]$)/g, '')
}

export function findSymbol(symbols: SymbolInformation[], document: TextDocument, position: Position): SymbolInformation | null {
    const word = getWordAtPostion(document, position)
    for (const symbol of symbols) {
        if (symbol.location.uri != document.uri) continue
        const signs = [SymbolKind.Method, SymbolKind.Property] as any, symbolName = trimQuote(symbol.name);
        if (
            (signs.includes(symbol.kind) && symbolName == word) ||
            (SymbolKind.Class == symbol.kind && symbolName == '.' + word)
        ) {
            return symbol;
        }
    }
    return null;
}