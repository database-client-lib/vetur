import _ from 'lodash';
import * as emmet from '@vscode/emmet-helper';
import { CompletionList, TextEdit } from 'vscode-languageserver-types';

import { StylePriority } from '../emmet';
import { LanguageModelCache, getLanguageModelCache } from '../../../embeddedSupport/languageModelCache';
import { LanguageMode } from '../../../embeddedSupport/languageModes';
import { VueDocumentRegions } from '../../../embeddedSupport/embeddedSupport';

import { provideCompletionItems } from './completion-item';
import { provideDocumentSymbols } from './symbols-finder';
import { stylusHover } from './stylus-hover';
import { getFileFsPath } from '../../../utils/paths';
import { VLSFormatConfig } from '../../../config';
import { DependencyService } from '../../../services/dependencyService';
import { EnvironmentService } from '../../../services/EnvironmentService';
import { sync } from 'glob';
import { NULL_COMPLETION } from '../../nullMode';

import fs from 'fs';
import path from 'path';

export function getStylusMode(
  env: EnvironmentService,
  documentRegions: LanguageModelCache<VueDocumentRegions>,
  dependencyService: DependencyService
): LanguageMode {
  const embeddedDocuments = getLanguageModelCache(10, 60, document =>
    documentRegions.refreshAndGet(document).getSingleLanguageDocument('stylus')
  );

  return {
    getId: () => 'stylus',
    onDocumentRemoved() { },
    dispose() { },
    doComplete(document, position) {
      const embedded = embeddedDocuments.refreshAndGet(document);

      const useSeparator =
        typeof env.getConfig().languageStylus.useSeparator === 'undefined'
          ? true
          : env.getConfig().languageStylus.useSeparator;

      const lsCompletions = provideCompletionItems(embedded, position, useSeparator);
      const lsItems = _.map(lsCompletions.items, i => {
        return {
          ...i,
          sortText: StylePriority.Platform + i.label
        };
      });

      const emmetCompletions = emmet.doComplete(document, position, 'stylus', env.getConfig().emmet);
      if (!emmetCompletions) {
        return { isIncomplete: false, items: lsItems };
      } else {
        const emmetItems = emmetCompletions.items.map(i => {
          return {
            ...i,
            sortText: StylePriority.Emmet + i.label
          };
        });
        return {
          isIncomplete: emmetCompletions.isIncomplete,
          items: _.concat(emmetItems, lsItems)
        };
      }
    },
    findDocumentSymbols(document) {
      const embedded = embeddedDocuments.refreshAndGet(document);
      return provideDocumentSymbols(embedded);
    },
    doHover(document, position) {
      const embedded = embeddedDocuments.refreshAndGet(document);
      return stylusHover(embedded, position);
    },
    format(document, range, formatParams) {
      return []
    }
  };
}

export const wordPattern = /(#?-?\d*\.\d\w*%?)|([$@#!.:]?[\w-?]+%?)|[$@#!.]/g;
