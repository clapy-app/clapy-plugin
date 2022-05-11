import { SingleBorderRadiusToken } from './SingleBorderRadiusToken';
import { SingleBorderWidthToken } from './SingleBorderWidthToken';
import { SingleBoxShadowToken } from './SingleBoxShadowToken';
import { SingleColorToken } from './SingleColorToken';
import { SingleFontFamiliesToken } from './SingleFontFamiliesToken';
import { SingleFontSizesToken } from './SingleFontSizesToken';
import { SingleFontWeightsToken } from './SingleFontWeightsToken';
import { SingleImplicitToken } from './SingleImplicitToken';
import { SingleLetterSpacingToken } from './SingleLetterSpacingToken';
import { SingleLineHeightsToken } from './SingleLineHeightsToken';
import { SingleOpacityToken } from './SingleOpacityToken';
import { SingleOtherToken } from './SingleOtherToken';
import { SingleParagraphSpacingToken } from './SingleParagraphSpacingToken';
import { SingleSpacingToken } from './SingleSpacingToken';
import { SingleTextCaseToken } from './SingleTextCaseToken';
import { SingleTextDecorationToken } from './SingleTextDecorationToken';
import { SingleTextToken } from './SingleTextToken';
import { SingleTypographyToken } from './SingleTypographyToken';
import { SingleUndefinedToken } from './SingleUndefinedToken';

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
