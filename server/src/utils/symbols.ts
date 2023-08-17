import type { TextDocument } from 'vscode-languageserver-textdocument';
import { LanguageModeRange, LanguageModes } from '../embeddedSupport/languageModes';
import { Position, SymbolInformation } from 'vscode-languageserver';
import { getWordAtPostion } from './strings';

export function collectSymbols(languageModes: LanguageModes, doc: TextDocument): SymbolInformation[] {
    const symbols: SymbolInformation[] = []
    languageModes.getAllLanguageModeRangesInDocument(doc).forEach(m => {
        if (m.mode.findDocumentSymbols) {
            symbols.push.apply(symbols, m.mode.findDocumentSymbols(doc));
        }
    });
    return symbols;
}

export function findSymbol(symbols: SymbolInformation[], document: TextDocument, position: Position): SymbolInformation | null {
    const word = getWordAtPostion(document, position)
    for (const symbol of symbols) {
        if ([6, 7].includes(symbol.kind) && symbol.name == word && symbol.location.uri == document.uri) {
            return symbol;
        }
    }
    return null;
}