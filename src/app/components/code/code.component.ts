import {
  Component,
  ChangeDetectionStrategy,
  Input,
  ViewChild,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
} from '@angular/core';


import {
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
} from '@angular/forms';

import { CodeInputComponent } from 'angular-code-input';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


@Component({
  selector: 'fs-code',
  templateUrl: './code.component.html',
  styleUrls: ['./code.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
     useExisting: FsCodeComponent,
     multi: true,
   }]
})
export class FsCodeComponent implements ControlValueAccessor, OnInit, OnDestroy {

  @ViewChild(CodeInputComponent)
  public codeInputComponent: CodeInputComponent;

  @Input() public codeLength = 6;

  @Output() public completed = new EventEmitter<number|string>();
  @Output() public changed = new EventEmitter<number|string>();

  private _code = null;
  private _destroy$ = new Subject();
  
  public ngOnInit(): void {
    this.changed.asObservable()
    .pipe(
      takeUntil(this._destroy$),
    )
    .subscribe((code) => {
      this.onChange(code);
    });
  }

  public focus(): void {
    this.codeInputComponent.focusOnField(0);
  } 

  public get code(): string|number {
    return this._code;
  }

  public clear(): void {
    this.onChange(null);
  }
  
  public writeValue(value): void {
    this._code = value;
  }

  public registerOnChange(_) { this.onChange = _; }
  public registerOnTouched(_) {}

  public onChange: any = (value) => {}
  public onTouch: any = () => {}

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}

