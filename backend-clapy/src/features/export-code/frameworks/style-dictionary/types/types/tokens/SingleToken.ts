import type { SingleBorderRadiusToken } from './SingleBorderRadiusToken.js';
import type { SingleBorderWidthToken } from './SingleBorderWidthToken.js';
import type { SingleBoxShadowToken } from './SingleBoxShadowToken.js';
import type { SingleColorToken } from './SingleColorToken.js';
import type { SingleFontFamiliesToken } from './SingleFontFamiliesToken.js';
import type { SingleFontSizesToken } from './SingleFontSizesToken.js';
import type { SingleFontWeightsToken } from './SingleFontWeightsToken.js';
import type { SingleImplicitToken } from './SingleImplicitToken.js';
import type { SingleLetterSpacingToken } from './SingleLetterSpacingToken.js';
import type { SingleLineHeightsToken } from './SingleLineHeightsToken.js';
import type { SingleOpacityToken } from './SingleOpacityToken.js';
import type { SingleOtherToken } from './SingleOtherToken.js';
import type { SingleParagraphSpacingToken } from './SingleParagraphSpacingToken.js';
import type { SingleSpacingToken } from './SingleSpacingToken.js';
import type { SingleTextCaseToken } from './SingleTextCaseToken.js';
import type { SingleTextDecorationToken } from './SingleTextDecorationToken.js';
import type { SingleTextToken } from './SingleTextToken.js';
import type { SingleTypographyToken } from './SingleTypographyToken.js';
import type { SingleUndefinedToken } from './SingleUndefinedToken.js';

export type SingleToken<Named extends boolean = true, P = unknown> =
  | SingleColorToken<Named, P>
  | SingleImplicitToken<Named, P>
  | SingleBorderRadiusToken<Named, P>
  | SingleTextToken<Named, P>
  | SingleTypographyToken<Named, P>
  | SingleOpacityToken<Named, P>
  | SingleBorderWidthToken<Named, P>
  | SingleBoxShadowToken<Named, P>
  | SingleFontFamiliesToken<Named, P>
  | SingleFontWeightsToken<Named, P>
  | SingleLineHeightsToken<Named, P>
  | SingleLetterSpacingToken<Named, P>
  | SingleFontSizesToken<Named, P>
  | SingleParagraphSpacingToken<Named, P>
  | SingleTextDecorationToken<Named, P>
  | SingleTextCaseToken<Named, P>
  | SingleSpacingToken<Named, P>
  | SingleOtherToken<Named, P>
  | SingleUndefinedToken<Named, P>;
