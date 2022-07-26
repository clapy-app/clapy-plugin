import type { Action } from './Action.js';
import type { AnyInspectStateAction } from './AnyInspectStateAction.js';
import type { AnySettingsStateAction } from './AnySettingsStateAction.js';
import type { AnyTokenStateAction } from './AnyTokenStateAction.js';
import type { AnyUiStateAction } from './AnyUiStateAction.js';

export type AnyAction<GlobalScope = false> =
  | Action<'RESET_APP'>
  | AnyInspectStateAction<GlobalScope>
  | AnySettingsStateAction<GlobalScope>
  | AnyTokenStateAction<GlobalScope>
  | AnyUiStateAction<GlobalScope>;
