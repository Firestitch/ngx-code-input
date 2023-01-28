import { InjectionToken } from '@angular/core';

import { CodeInputConfig } from '../interfaces/code-input-config.interface';

export const FsCodeInputConfigToken = new InjectionToken<CodeInputConfig>('FsCodeInputConfig');
