import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { FsCodeComponent } from './components/code/code.component';

import { CodeInputModule } from 'angular-code-input';


@NgModule({
  imports: [
    CommonModule,

    MatDialogModule,
    MatButtonModule,

    CodeInputModule,
  ],
  exports: [
    FsCodeComponent,
  ],
  declarations: [
    FsCodeComponent,
  ],
})
export class FsCodeModule {}
