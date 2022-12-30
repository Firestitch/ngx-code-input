import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { KitchenSinkConfigureComponent } from '../kitchen-sink-configure';
import { FsExampleComponent } from '@firestitch/example';
import { FsMessage } from '@firestitch/message';
import { ShareConfig } from 'src/app/interfaces';
import { ShareEvent } from 'src/app/interfaces/share-event.interface';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';


@Component({
  selector: 'kitchen-sink',
  templateUrl: 'kitchen-sink.component.html',
  styleUrls: ['kitchen-sink.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenSinkComponent implements OnInit {

  public code: any = '';

  constructor(
    private exampleComponent: FsExampleComponent,
    private _message: FsMessage,
  ) {
  }

  public ngOnInit() {
  }

  public open = (event) => {
    console.log(event);
    if (event.platform == 'copy') {
      this._message.success('Link copied');
    } else {
      this._message.success(event.platform + ' share opened');
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
}
