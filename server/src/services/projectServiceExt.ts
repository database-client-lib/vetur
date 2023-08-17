import { CompletionItem, Location, Position, Range } from "vscode-languageserver-types"
import { TextDocument } from 'vscode-languageserver-textdocument';
import { LanguageModes } from "../embeddedSupport/languageModes"
import { findSymbol, collectSymbols } from "../utils/symbols"
import { getPreviousWords, getWordAtPostion } from "../utils/strings";
import { CompletionItemKind } from "vscode-css-languageservice";

/**
 * 补全增强
 */
export function onCompletionExt(items: CompletionItem[], languageModes: LanguageModes, doc: TextDocument, position: Position) {
    const words = getPreviousWords(doc, position);
    if (!words.some(w => w == 'this')) return items;

    const newItems = [];
    const map: any = {};
    // this支持方法调用
    for (const symbol of collectSymbols(languageModes, doc)) {
        if (!symbol.name.match(/^\w+$/) || map[symbol.name]) continue;
        map[symbol.name] = true;
        newItems.push({
            sortText: '1222',
            label: symbol.name,
            uri: symbol.location.uri,
            kind: CompletionItemKind.Method
        })
    }
    // 补充原来的补全
    for (const item of items) {
        if (!map[item.label]) newItems.push(item)
    }
    return newItems;
}

/**
 * 跳转定义增强
 */
export function onDefinitionExt(defs: Location[], languageModes: LanguageModes, doc: TextDocument, position: Position) {
    // 如果vetur自带的逻辑找不到, 自行查询
    if (defs.length == 0) {
        const symbol = findSymbol(collectSymbols(languageModes, doc), doc, position)
        if (symbol) {
            defs.push(symbol.location)
            return defs
        }
    }
    // 匹配ref, 因为$refs会跳转到node_modules, 没什么意义
    for (const def of defs) {
        if (!def.uri.includes('node_modules')) return; // 这段判断是为了防止变量名和ref冲突
    }
    const word = getWordAtPostion(doc, position)
    const refs = collectRefs(doc.getText())
    for (const ref of refs) {
        if (ref.name == word) {
            if (defs.length > 0) defs.shift()
            defs.unshift({ range: ref.range, uri: doc.uri })
            break;
        }
    }
}

function collectRefs(text: string) {
    const results = []
    let startTag = false, tag = '', plainText = '', line = 0, character = 0;

    const reset = () => {
        tag = '';
        plainText = '';
        startTag = false;
    }

    for (let i = 0; i < text.length; i++) {
        const ch = text.charAt(i);
        if (ch == '\n') {
            line++; character = 0;
        } else character++;
        if (ch == '<') startTag = true
        else if (ch == '>') reset();
        else if (startTag) {
            // 收集标签
            if (ch.match(/\w/)) tag += ch;
            else startTag = false;
        } else {
            plainText += ch;
            const res = plainText.match(/ref=['"](\w+)['"]/)
            if (res) {
                results.push({
                    tag: tag.toLowerCase(), name: res[1],
                    range: Range.create(
                        Position.create(line, character - res[1].length - 1),
                        Position.create(line, character - 1)
                    )
                })
                reset();
            }
        }
    }
    return results;
}
