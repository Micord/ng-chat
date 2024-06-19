import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { NgChat } from './ng-chat.component';
import { EmojifyPipe } from './pipes/emojify.pipe';
import { LinkfyPipe } from './pipes/linkfy.pipe';
import { SanitizePipe } from './pipes/sanitize.pipe';
import { GroupMessageDisplayNamePipe } from './pipes/group-message-display-name.pipe';
import { NgChatContextMenuComponent } from "./components/ng-chat-context-menu/ng-chat-context-menu.component";
import { NgChatOptionsComponent } from './components/ng-chat-options/ng-chat-options.component';
import { NgChatParticipantsComponent } from './components/ng-chat-participants/ng-chat-participants.component';
import { NgChatWindowComponent } from './components/ng-chat-window/ng-chat-window.component';

@NgModule({
  imports: [CommonModule, FormsModule, HttpClientModule],
  declarations: [
    NgChat,
    EmojifyPipe,
    LinkfyPipe,
    SanitizePipe,
    GroupMessageDisplayNamePipe,
    NgChatContextMenuComponent,
    NgChatOptionsComponent,
    NgChatParticipantsComponent,
    NgChatWindowComponent
  ],
  exports: [NgChat]
})
export class NgChatModule {
}
