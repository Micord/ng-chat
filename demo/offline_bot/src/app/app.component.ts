import { Component } from '@angular/core';
import { ChatAdapter, NgChatModule } from 'ng-chat';
import { DemoAdapter } from './demo-adapter';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    imports: [NgChatModule]
})
export class AppComponent {
  title = 'app';

  public adapter: ChatAdapter = new DemoAdapter();


  public messageSeen(event: any) {
    console.log(event);
  }
}
