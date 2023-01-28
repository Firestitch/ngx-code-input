export interface CodeInputConfig {
  codeLength?: number;
  inputType?: string;
  inputMode?: string;
  initialFocusField?: number;
  isCharsCode?: boolean;
  isCodeHidden?: boolean;
  isPrevFocusableAfterClearing?: boolean;
  isFocusingOnLastByClickIfFilled?: boolean;
  code?: string | number;
  disabled?: boolean;
  autocapitalize?: string;
}
