import type { TextDocument } from 'vscode-languageserver-textdocument';
import { LanguageModeRange } from '../embeddedSupport/languageModes';
import { SymbolInformation } from 'vscode-languageserver';

export function collectSymbols(ranges: LanguageModeRange[], doc: TextDocument): SymbolInformation[] {
    const symbols: SymbolInformation[] = []
    ranges.forEach(m => {
        if (m.mode.findDocumentSymbols) {
            symbols.push.apply(symbols, m.mode.findDocumentSymbols(doc));
        }
    });
    return symbols;
}
