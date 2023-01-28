import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { FsCodeInputComponent } from './components/code/code.component';


@NgModule({
  imports: [
    CommonModule,
  ],
  exports: [
    FsCodeInputComponent,
  ],
  declarations: [
    FsCodeInputComponent,
  ],
})
export class FsCodeModule {}
