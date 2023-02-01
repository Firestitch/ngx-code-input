import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  AfterViewInit,
  OnChanges,
  AfterViewChecked,
  ViewChildren,
  QueryList,
  ElementRef,
  Inject,
  Optional,
  SimpleChanges,
} from '@angular/core';

import {
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
} from '@angular/forms';

import { Subject, Subscription } from 'rxjs';

import { CodeInputState } from '../../enum/code-input-state';
import { CodeInputConfig } from '../../interfaces/code-input-config.interface';
import { FsCodeInputConfigToken } from '../../tokens/code-input-config.token';


@Component({
  selector: 'fs-code-input',
  templateUrl: './code-input.component.html',
  styleUrls: ['./code-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
     useExisting: FsCodeInputComponent,
     multi: true,
   }]
})
export class FsCodeInputComponent
  implements AfterViewInit, OnInit, OnChanges, OnDestroy, AfterViewChecked, ControlValueAccessor {

  @Input()
  public codeLength: number;

  @Input()
  public inputType !: string;

  @Input()
  public inputMode !: string;

  @Input()
  public initialFocusField?: number;

  @Input()
  public isCharsCode !: boolean;

  @Input()
  public isCodeHidden !: boolean;

  @Input()
  public isPrevFocusableAfterClearing !: boolean;

  @Input()
  public isFocusingOnLastByClickIfFilled !: boolean;

  @Input()
  public disabled !: boolean;

  @Input()
  public autocapitalize ?: string;

  @Output('changed')
  public readonly codeChanged = new EventEmitter<string>();
  
  @Output('completed')
  public readonly codeCompleted = new EventEmitter<string>();

  @ViewChildren('input')
  public inputsList !: QueryList<ElementRef>;

  public placeholders: number[] = [];

  private _onChange: any = (value) => {}
  private _onTouch: any = () => {}
  private _code = null;
  private _inputs: HTMLInputElement[] = [];
  private _inputsStates: CodeInputState[] = [];
  private _inputsListSubscription !: Subscription;
  private _codeLength !: number;
  private _state = {
    isFocusingAfterAppearingCompleted: false,
    isInitialFocusFieldEnabled: true
  };
  private _destroy$ = new Subject();

  constructor(
    @Optional()
    @Inject(FsCodeInputConfigToken)
    config?: CodeInputConfig
  ) {
    this._initWithConfig(config || {});
  }

  public get code(): string|number {
    return this._code;
  }

  /**
   * Life cycle
   */

  public ngOnInit(): void {
    // defining the state
    this._state.isInitialFocusFieldEnabled = !this.isEmpty(this.initialFocusField);
    // initiating the code
    this.onCodeLengthChanges();
  }

  public ngAfterViewInit(): void {
    // initiation of the inputs
    this._inputsListSubscription = this.inputsList.changes.subscribe(this.onInputsListChanges.bind(this));
    this.onInputsListChanges(this.inputsList);
  }

  public ngAfterViewChecked(): void {
    this.focusOnInputAfterAppearing();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.code) {
      this.onInputCodeChanges();
    }
    if (changes.codeLength) {
      this.onCodeLengthChanges();
    }
  }

  public ngOnDestroy(): void {
    if (this._inputsListSubscription) {
      this._inputsListSubscription.unsubscribe();
    }

    this._destroy$.next();
    this._destroy$.complete();
  }

  public clear(): void {
    this._onChange(null);
  }

  public writeValue(value): void {
    this._code = value;
  }

  /**
   * Methods
   */

  public reset(isChangesEmitting = false): void {
    // resetting the code to its initial value or to an empty value
    this.onInputCodeChanges();

    if (this._state.isInitialFocusFieldEnabled) {
      // tslint:disable-next-line:no-non-null-assertion
      this.focusOnField(this.initialFocusField!);
    }

    if (isChangesEmitting) {
      this.emitChanges();
    }
  }

  public focus(): void {
    this.focusOnField(0);
  }

  public focusOnField(index: number): void {
    if (index >= this._codeLength) {
      throw new Error('The index of the focusing input box should be less than the codeLength.');
    }

    this._inputs[index].focus();
  }

  public onFocus(event: FocusEvent): void {
    (event.target as any).select();
  }

  public onClick(e: any): void {
    // handle click events only if the the prop is enabled
    if (!this.isFocusingOnLastByClickIfFilled) {
      return;
    }

    const target = e.target;
    const last = this._inputs[this._codeLength - 1];
    // already focused
    if (target === last) {
      return;
    }

    // check filling
    const isFilled = this.getCurrentFilledCode().length >= this._codeLength;
    if (!isFilled) {
      return;
    }

    // focusing on the last input if is filled
    setTimeout(() => last.focus());
  }

  public onInput(e: any, i: number): void {
    const target = e.target;
    const value = e.data || target.value;

    if (this.isEmpty(value)) {
      return;
    }

    // only digits are allowed if isCharsCode flag is absent/false
    if (!this.canInputValue(value)) {
      e.preventDefault();
      e.stopPropagation();
      this.setInputValue(target, null);
      this.setStateForInput(target, CodeInputState.reset);
      return;
    }

    const values = value.toString().trim().split('');
    for (let j = 0; j < values.length; j++) {
      const index = j + i;
      if (index > this._codeLength - 1) {
        break;
      }

      this.setInputValue(this._inputs[index], values[j]);
    }
    this.emitChanges();

    const next = i + values.length;
    if (next > this._codeLength - 1) {
      return;
    }

    this._inputs[next].focus();
    this._onTouch();
  }

  public onPaste(e: ClipboardEvent, i: number): void {
    e.preventDefault();
    e.stopPropagation();

    const data = e.clipboardData ? e.clipboardData.getData('text').trim() : undefined;

    if (this.isEmpty(data)) {
      return;
    }

    // Convert paste text into iterable
    // tslint:disable-next-line:no-non-null-assertion
    const values = data!.split('');
    let valIndex = 0;

    for (let j = i; j < this._inputs.length; j++) {
      // The values end is reached. Loop exit
      if (valIndex === values.length) {
        break;
      }

      const input = this._inputs[j];
      const val = values[valIndex];

      // Cancel the loop when a value cannot be used
      if (!this.canInputValue(val)) {
        this.setInputValue(input, null);
        this.setStateForInput(input, CodeInputState.reset);
        return;
      }

      this.setInputValue(input, val.toString());
      valIndex++;
    }

    this._inputs[i].blur();
    this.emitChanges();
  }

  public async onKeydown(e: any, i: number): Promise<void> {
    const target = e.target;
    const isTargetEmpty = this.isEmpty(target.value);
    const prev = i - 1;

    // processing only the backspace and delete key events
    const isBackspaceKey = await this.isBackspaceKey(e);
    const isDeleteKey = this.isDeleteKey(e);
    if (!isBackspaceKey && !isDeleteKey) {
      return;
    }

    e.preventDefault();

    this.setInputValue(target, null);
    if (!isTargetEmpty) {
      this.emitChanges();
    }

    // preventing to focusing on the previous field if it does not exist or the delete key has been pressed
    if (prev < 0 || isDeleteKey) {
      return;
    }

    if (isTargetEmpty || this.isPrevFocusableAfterClearing) {
      this._inputs[prev].focus();
    }
  }

  public registerOnChange(_) { this._onChange = _; }
  public registerOnTouched(_) {}

  private _initWithConfig(config: CodeInputConfig) {
    this._code         = config.code;
    this.disabled     = config.disabled ?? false;
    this.codeLength   = config.codeLength ?? 6;
    this.inputType    = config.inputType ?? 'tel';
    this.inputMode    = config.inputMode ?? 'numeric';
    this.isCharsCode  = config.isCharsCode ?? false;
    this.isCodeHidden = config.isCodeHidden ?? false;
    this.autocapitalize = config.autocapitalize;
    this.initialFocusField = config.initialFocusField ?? 0;
    this.isPrevFocusableAfterClearing = config.isPrevFocusableAfterClearing ?? true;
    this.isFocusingOnLastByClickIfFilled = config.isFocusingOnLastByClickIfFilled ?? false;
  }

  private onInputCodeChanges(): void {
    if (!this._inputs.length) {
      return;
    }

    if (this.isEmpty(this.code)) {
      this._inputs.forEach((input: HTMLInputElement) => {
        this.setInputValue(input, null);
      });
      return;
    }

    // tslint:disable-next-line:no-non-null-assertion
    const chars = this.code!.toString().trim().split('');
    // checking if all the values are correct
    let isAllCharsAreAllowed = true;
    for (const char of chars) {
      if (!this.canInputValue(char)) {
        isAllCharsAreAllowed = false;
        break;
      }
    }

    this._inputs.forEach((input: HTMLInputElement, index: number) => {
      const value = isAllCharsAreAllowed ? chars[index] : null;
      this.setInputValue(input, value);
    });
  }

  private onCodeLengthChanges(): void {
    if (!this.codeLength) {
      return;
    }

    this._codeLength = this.codeLength;
    if (this._codeLength > this.placeholders.length) {
      const numbers = Array(this._codeLength - this.placeholders.length).fill(1);
      this.placeholders.splice(this.placeholders.length - 1, 0, ...numbers);
    }
    else if (this._codeLength < this.placeholders.length) {
      this.placeholders.splice(this._codeLength);
    }
  }

  private onInputsListChanges(list: QueryList<ElementRef>): void {
    if (list.length > this._inputs.length) {
      const inputsToAdd = list.filter((item, index) => index > this._inputs.length - 1);
      this._inputs.splice(this._inputs.length, 0, ...inputsToAdd.map(item => item.nativeElement));
      const states = Array(inputsToAdd.length).fill(CodeInputState.ready);
      this._inputsStates.splice(this._inputsStates.length, 0, ...states);
    }
    else if (list.length < this._inputs.length) {
      this._inputs.splice(list.length);
      this._inputsStates.splice(list.length);
    }

    // filling the inputs after changing of their count
    this.onInputCodeChanges();
  }

  private focusOnInputAfterAppearing(): void {
    if (!this._state.isInitialFocusFieldEnabled) {
      return;
    }

    if (this._state.isFocusingAfterAppearingCompleted) {
      return;
    }

    // tslint:disable-next-line:no-non-null-assertion
    this.focusOnField(this.initialFocusField!);
    // tslint:disable-next-line:no-non-null-assertion
    this._state.isFocusingAfterAppearingCompleted = document.activeElement === this._inputs[this.initialFocusField!];
  }

  private emitChanges(): void {
    setTimeout(() => this.emitCode(), 50);
  }

  private emitCode(): void {
    const code = this.getCurrentFilledCode();

    this.codeChanged.emit(code);
    this._onChange(code);

    if (code.length >= this._codeLength) {
      this.codeCompleted.emit(code);
    }
  }

  private getCurrentFilledCode(): string {
    let code = '';

    for (const input of this._inputs) {
      if (!this.isEmpty(input.value)) {
        code += input.value;
      }
    }

    return code;
  }

  private isBackspaceKey(e: any): Promise<boolean> {
    const isBackspace = (e.key && e.key.toLowerCase() === 'backspace') || (e.keyCode && e.keyCode === 8);
    if (isBackspace) {
      return Promise.resolve(true);
    }

    // process only key with placeholder keycode on android devices
    if (!e.keyCode || e.keyCode !== 229) {
      return Promise.resolve(false);
    }

    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        const input = e.target;
        const isReset = this.getStateForInput(input) === CodeInputState.reset;
        if (isReset) {
          this.setStateForInput(input, CodeInputState.ready);
        }
        // if backspace key pressed the caret will have position 0 (for single value field)
        resolve(input.selectionStart === 0 && !isReset);
      });
    });
  }

  private isDeleteKey(e: any): boolean {
    return (e.key && e.key.toLowerCase() === 'delete') || (e.keyCode && e.keyCode === 46);
  }

  private setInputValue(input: HTMLInputElement, value: any): void {
    const isEmpty = this.isEmpty(value);
    const valueClassCSS = 'has-value';
    const emptyClassCSS = 'empty';
    if (isEmpty) {
      input.value = '';
      input.classList.remove(valueClassCSS);
      // tslint:disable-next-line:no-non-null-assertion
      input.parentElement!.classList.add(emptyClassCSS);
    }
    else {
      input.value = value;
      input.classList.add(valueClassCSS);
      // tslint:disable-next-line:no-non-null-assertion
      input.parentElement!.classList.remove(emptyClassCSS);
    }
  }

  private canInputValue(value: any): boolean {
    if (this.isEmpty(value)) {
      return false;
    }

    const isDigitsValue = /^[0-9]+$/.test(value.toString());
    return isDigitsValue || (this.isCharsCode);
  }

  private setStateForInput(input: HTMLInputElement, state: CodeInputState): void {
    const index = this._inputs.indexOf(input);
    if (index < 0) {
      return;
    }

    this._inputsStates[index] = state;
  }

  private getStateForInput(input: HTMLInputElement): CodeInputState | undefined {
    const index = this._inputs.indexOf(input);
    return this._inputsStates[index];
  }

  private isEmpty(value: any): boolean {
    return  value === null || value === undefined || !value.toString().length;
  }
}
