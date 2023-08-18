import { TextEdit, Range } from 'vscode-languageserver-types';

import type { BuiltInParserName, CustomParser, Options as PrettierOptions } from 'prettier';
import { indentSection } from '../strings';

import { VLSFormatConfig } from '../../config';
import { logger } from '../../log';
import path from 'path';
import { DependencyService, RuntimeLibrary } from '../../services/dependencyService';

const VLS_PATH = path.resolve(__dirname, '../../../');

type PrettierParserOption = BuiltInParserName | CustomParser;

export function prettierify(
  dependencyService: DependencyService,
  code: string,
  fileFsPath: string,
  languageId: string,
  range: Range,
  vlsFormatConfig: VLSFormatConfig,
  initialIndent: boolean
): TextEdit[] {
  try {
    const prettier = dependencyService.get('prettier', fileFsPath).module;
    const prettierOptions = getPrettierOptions(dependencyService, prettier, fileFsPath, languageId, vlsFormatConfig);
    logger.logDebug(`Using prettier. Options\n${JSON.stringify(prettierOptions)}`);

    const prettierifiedCode = prettier.format(code, prettierOptions);
    if (prettierifiedCode === '' && code.trim() !== '') {
      throw Error('Empty result from prettier');
    }

    return [toReplaceTextedit(prettierifiedCode, range, vlsFormatConfig, initialIndent)];
  } catch (e) {
    console.log('Prettier format failed');
    console.error((e as Error).stack);
    return [];
  }
}

function getPrettierOptions(
  dependencyService: DependencyService,
  prettierModule: RuntimeLibrary['prettier'],
  fileFsPath: string,
  languageId: string,
  vlsFormatConfig: VLSFormatConfig
): PrettierOptions {
  const prettierrcOptions = prettierModule.resolveConfig.sync(fileFsPath, { useCache: false });

  const getParser = () => {
    const table = {
      javascript: 'babel',
      typescript: 'typescript',
      vue: 'vue',
      css: 'css',
      postcss: 'css',
      scss: 'scss',
      less: 'less'
    };
    return table?.[languageId as 'javascript'] ?? 'babel';
  };

  if (prettierrcOptions) {
    prettierrcOptions.tabWidth = prettierrcOptions.tabWidth || vlsFormatConfig.options.tabSize;
    prettierrcOptions.useTabs = prettierrcOptions.useTabs || vlsFormatConfig.options.useTabs;
    prettierrcOptions.parser = getParser();
    if (dependencyService.useWorkspaceDependencies) {
      // For loading plugins such as @prettier/plugin-pug
      (
        prettierrcOptions as {
          pluginSearchDirs: string[];
        }
      ).pluginSearchDirs = dependencyService.nodeModulesPaths.map(el => path.dirname(el));
    }

    return prettierrcOptions;
  } else {
    const vscodePrettierOptions = vlsFormatConfig.defaultFormatterOptions.prettier || {};
    vscodePrettierOptions.tabWidth = vscodePrettierOptions.tabWidth || vlsFormatConfig.options.tabSize;
    vscodePrettierOptions.useTabs = vscodePrettierOptions.useTabs || vlsFormatConfig.options.useTabs;
    vscodePrettierOptions.parser = getParser();
    if (dependencyService.useWorkspaceDependencies) {
      // For loading plugins such as @prettier/plugin-pug
      vscodePrettierOptions.pluginSearchDirs = dependencyService.nodeModulesPaths.map(el => path.dirname(el));
    }

    return vscodePrettierOptions;
  }
}

function toReplaceTextedit(
  prettierifiedCode: string,
  range: Range,
  vlsFormatConfig: VLSFormatConfig,
  initialIndent: boolean
): TextEdit {
  if (initialIndent) {
    // Prettier adds newline at the end
    const formattedCode = '\n' + indentSection(prettierifiedCode, vlsFormatConfig);
    return TextEdit.replace(range, formattedCode);
  } else {
    return TextEdit.replace(range, '\n' + prettierifiedCode);
  }
}
