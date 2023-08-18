/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  IPropertyData,
  IAtDirectiveData,
  IPseudoClassData,
  IPseudoElementData
} from 'vscode-css-languageservice';
// @ts-ignore

export interface LoadedCSSData {
  properties: IPropertyData[];
  atDirectives: IAtDirectiveData[];
  pseudoClasses: IPseudoClassData[];
  pseudoElements: IPseudoElementData[];
}

export const cssData: LoadedCSSData = {
  properties: [],
  atDirectives: [],
  pseudoClasses: [],
  pseudoElements: []
};
