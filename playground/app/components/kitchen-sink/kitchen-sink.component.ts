import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FsExampleComponent } from '@firestitch/example';
import { FsMessage } from '@firestitch/message';

import { of } from 'rxjs';
import { delay } from 'rxjs/operators';


@Component({
  selector: 'kitchen-sink',
  templateUrl: './kitchen-sink.component.html',
  styleUrls: ['./kitchen-sink.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenSinkComponent {

  public code: any = '';

  constructor(
    private exampleComponent: FsExampleComponent,
    private _message: FsMessage,
  ) {
  }

  public open = (event) => {
    console.log(event);
    if (event.platform == 'copy') {
      this._message.success('Link copied');
    } else {
      this._message.success(`${event.platform  } share opened`);
    }

    return of(true)
      .pipe(
        delay(1000),
      );
  };

  public changed(code) {
    console.log('Chagned', code);
  }

  public completed(code) {
    console.log('Completed', code);
  }

  public completedLast(code) {
    console.log('Completed Last', code);
  }
}
