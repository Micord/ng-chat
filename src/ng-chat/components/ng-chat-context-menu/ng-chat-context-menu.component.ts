import { Component, EventEmitter, Output } from "@angular/core";

@Component({
    selector: 'ng-chat-context-menu',
    templateUrl: './ng-chat-context-menu.component.html',
    styleUrls: ['./ng-chat-context-menu.component.css'],
    standalone: false
})
export class NgChatContextMenuComponent {
  constructor() { }

  @Output()
  public contextMenuAction: EventEmitter<any> = new EventEmitter<any>();

  onMenuClicked(): void
  {
    console.info("menu clicked");
    this.contextMenuAction.emit();
  }
}
