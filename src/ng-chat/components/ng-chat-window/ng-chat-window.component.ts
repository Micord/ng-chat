import { Component, Input, Output, EventEmitter, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';

import { Message } from "../../core/message";
import { MessageType } from "../../core/message-type.enum";
import { ChatWindow } from "../../core/chat-window";
import { ChatParticipantStatus } from "../../core/chat-participant-status.enum";
import { ScrollDirection } from "../../core/scroll-direction.enum";
import { Localization } from '../../core/localization';
import { IFileUploadAdapter } from '../../core/file-upload-adapter';
import { IChatOption } from '../../core/chat-option';
import { ChatOptionType } from "../../core/chat-option-type.enum";
import { IChatParticipant } from "../../core/chat-participant";
import { MessageCounter } from "../../core/message-counter";
import { chatParticipantStatusDescriptor } from '../../core/chat-participant-status-descriptor';

@Component({
    selector: 'ng-chat-window',
    templateUrl: './ng-chat-window.component.html',
    styleUrls: ['./ng-chat-window.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class NgChatWindowComponent {
    constructor() { }

    @Input()
    public fileUploadAdapter: IFileUploadAdapter;

    @Input()
    public chatWindow: ChatWindow;

    @Input()
    public userId: any;

    @Input()
    public localization: Localization;

    @Input()
    public currentActiveOption: IChatOption | null;

    @Input()
    public emojisEnabled: boolean = true;

    @Input()
    public linkfyEnabled: boolean = true;

    @Input()
    public showMessageDate: boolean = true;

    @Input()
    public messageDatePipeFormat: string = "short";

    @Input()
    public hasPagedHistory: boolean = true;

    @Output()
    public onDeleteMessage: EventEmitter<Message> = new EventEmitter();

    @Output()
    public onMessagesSeen: EventEmitter<Message[]> = new EventEmitter();

    @Output()
    public onMessageSent: EventEmitter<Message> = new EventEmitter();

    @Output()
    public onOptionTriggered: EventEmitter<IChatOption> = new EventEmitter();

    @Output()
    public onLoadHistoryTriggered: EventEmitter<ChatWindow> = new EventEmitter();

    @Output()
    public onMessageClicked: EventEmitter<Message> = new EventEmitter();

    @Output()
    public onOptionPromptCanceled: EventEmitter<any> = new EventEmitter();

    @Output()
    public onOptionPromptConfirmed: EventEmitter<Message[]> = new EventEmitter();

    public selectedMessages: Message[] = [];

    @ViewChild('chatMessages') chatMessages: any;
    @ViewChild('nativeFileInput') nativeFileInput: ElementRef;
    @ViewChild('chatWindowInput') chatWindowInput: any;

    // File upload state
    public fileUploadersInUse: string[] = []; // Id bucket of uploaders in use

    // Exposes enums and functions for the ng-template
    public ChatParticipantStatus = ChatParticipantStatus;
    public MessageType = MessageType;
    public chatParticipantStatusDescriptor = chatParticipantStatusDescriptor;

    // right click context menu
    public menuTopLeftPosition =  {x: 0, y: 0};
    public activateContextMenu: boolean = false;
    private selectedMessage: Message;

    onRightClick(event: MouseEvent, message: Message) {
        console.info("right click on message id=" + message.id);
        // preventDefault avoids to show the visualization of the right-click menu of the browser
        event.preventDefault();
        // record the mouse position in our object
        this.menuTopLeftPosition.x = event.clientX;
        this.menuTopLeftPosition.y = event.clientY;

        if (this.contextMenuShownOnMessage(message)) {
            // hide context menu
            this.activateContextMenu = false;
        }
        else if (this.contextMenuShowCondition(message)) {
            this.selectedMessage = message;
            // show context menu
            this.activateContextMenu = true;
        }
        else {
          this.activateContextMenu = false;
        }
    }

    private contextMenuShowCondition(message: Message): boolean {
      return message && (!this.userId || message.fromId == this.userId);

    }

    private contextMenuShownOnMessage(message: Message): boolean {
      return this.activateContextMenu && message && this.selectedMessage
             && this.selectedMessage.id == message.id;
    }

    defaultWindowOptions(currentWindow: ChatWindow): IChatOption[]
    {
            return [{
                type: ChatOptionType.Message,
                isActive: false,
                chattingTo: currentWindow,
                validateMessageContext: (message: Message) =>
                     !message.isDeleted && message.fromId == this.userId,
                validateParticipantContext: (participant: IChatParticipant) => false,
                displayLabel: 'Delete messages' // TODO: Localize this
            }];
    }

    // Asserts if a user avatar is visible in a chat cluster
    isAuthorNameVisible(window: ChatWindow, message: Message, index: number): boolean
    {
        if (message.fromId != this.userId){
            if (index == 0){
                return true; // First message, good to show the thumbnail
            }
            else{
                // Check if the previous message belongs to the same user, if it belongs there is
                // no need to show the avatar again to form the message cluster
                if (window.messages[index - 1].fromId != message.fromId){
                    return true;
                }
            }
        }

        return false;
    }

    isUploadingFile(window: ChatWindow): boolean
    {
        const fileUploadInstanceId = this.getUniqueFileUploadInstanceId(window);

        return this.fileUploadersInUse.indexOf(fileUploadInstanceId) > -1;
    }

    // Generates a unique file uploader id for each participant
    getUniqueFileUploadInstanceId(window: ChatWindow): string
    {
        if (window && window.participant)
        {
            return `ng-chat-file-upload-${window.participant.id}`;
        }

        return 'ng-chat-file-upload';
    }

    unreadMessagesTotal(chatWindow: ChatWindow): string
    {
        return MessageCounter.unreadMessagesTotal(chatWindow, this.userId);
    }

    // Scrolls a chat window message flow to the bottom
    scrollChatWindow(chatWindow: ChatWindow, direction: ScrollDirection): void
    {
        if (!chatWindow.isCollapsed){
            setTimeout(() => {
                if (this.chatMessages){
                    let element = this.chatMessages.nativeElement;
                    let position = ( direction === ScrollDirection.Top ) ? 0 : element.scrollHeight;
                    element.scrollTop = position;
                }
            });
        }
    }

    activeOptionTrackerChange(option: IChatOption): void {
        this.onOptionTriggered.emit(option);
    }

    // Triggers native file upload for file selection from the user
    triggerNativeFileUpload(window: ChatWindow): void
    {
        if (window)
        {
            if (this.nativeFileInput) this.nativeFileInput.nativeElement.click();
        }
    }

    // Toggles a window focus on the focus/blur of a 'newMessage' input
    toggleWindowFocus(window: ChatWindow): void
    {
        window.hasFocus = !window.hasFocus;
        if(window.hasFocus) {
            const unreadMessages = window.messages
                .filter(message => message.dateSeen == null);

            if (unreadMessages && unreadMessages.length > 0)
            {
                this.onMessagesSeen.emit(unreadMessages);
            }
        }
    }

    deactivateContextMenu(): void
    {
      this.activateContextMenu = false;
    }

    deleteMessage(): void
    {
      if (this.selectedMessage) {
        this.onDeleteMessage.emit(this.selectedMessage);
        this.activateContextMenu = false;
      }
    }

      markMessagesAsRead(messages: Message[]): void
    {
        this.onMessagesSeen.emit(messages);
    }

    fetchMessageHistory(window: ChatWindow): void
    {
        this.onLoadHistoryTriggered.emit(window);
    }

    /*  Monitors pressed keys on a chat window
        - Dispatches a message when the CTRL + ENTER keys are pressed
        - Tabs between windows on TAB or SHIFT + TAB
        - Closes the current focused window on ESC
    */
    onChatInputTyped(event: any, window: ChatWindow): void
    {
       switch (event.keyCode)
       {
           case 13:
               if (event.ctrlKey)
               {
                 this.sendMessage(window);
               }
               break;
           case 9:
               event.preventDefault();

               break;
           case 27:
               break;
       }
    }

    sendMessage(window: ChatWindow): void
    {
      if (window.newMessage && window.newMessage.trim() != "")
      {
        let message = new Message();

        message.fromId = this.userId;
        message.toId = window.participant.id;
        message.message = window.newMessage;
        message.dateSent = new Date();

        window.messages.push(message);

        this.onMessageSent.emit(message);

        window.newMessage = ""; // Resets the new message input

        this.scrollChatWindow(window, ScrollDirection.Bottom);
      }
    }

    // Toggles a chat window visibility between maximized/minimized
    onChatWindowClicked(window: ChatWindow): void
    {
        window.isCollapsed = !window.isCollapsed;
        this.scrollChatWindow(window, ScrollDirection.Bottom);
    }

    private clearInUseFileUploader(fileUploadInstanceId: string): void
    {
        const uploaderInstanceIdIndex = this.fileUploadersInUse.indexOf(fileUploadInstanceId);

        if (uploaderInstanceIdIndex > -1) {
            this.fileUploadersInUse.splice(uploaderInstanceIdIndex, 1);
        }
    }

    // Handles file selection and uploads the selected file using the file upload adapter
    onFileChosen(window: ChatWindow): void {
        const fileUploadInstanceId = this.getUniqueFileUploadInstanceId(window);
        const uploadElementRef = this.nativeFileInput;

        if (uploadElementRef)
        {
            const file: File = uploadElementRef.nativeElement.files[0];

            this.fileUploadersInUse.push(fileUploadInstanceId);

            this.fileUploadAdapter.uploadFile(file, window.participant.id)
                .subscribe(fileMessage => {
                    this.clearInUseFileUploader(fileUploadInstanceId);

                    fileMessage.fromId = this.userId;

                    // Push file message to current user window
                    window.messages.push(fileMessage);

                    this.onMessageSent.emit(fileMessage);

                    this.scrollChatWindow(window, ScrollDirection.Bottom);

                    // Resets the file upload element
                    uploadElementRef.nativeElement.value = '';
                }, (error) => {
                    this.clearInUseFileUploader(fileUploadInstanceId);

                    // Resets the file upload element
                    uploadElementRef.nativeElement.value = '';

                    // TODO: Invoke a file upload adapter error here
                });
        }
    }

    cleanUpMessageSelection = () => this.selectedMessages = [];

    isMessageSelectedFromParticipantsList(message: Message) : boolean
    {
       return (this.selectedMessages.filter(item => item.id == message.id)).length > 0
    }

    onMessagesListCheckboxChange(selectedMessage: Message, isChecked: boolean): void
    {
        if(isChecked) {
            this.selectedMessages.push(selectedMessage);
        }
        else
        {
            this.selectedMessages.splice(this.selectedMessages.indexOf(selectedMessage), 1);
        }
    }

    onMessageClick(clickedMessage: Message): void
    {
        this.onMessageClicked.emit(clickedMessage);
    }

    onMessagesListActionCancelClicked(): void
    {
      this.onOptionPromptCanceled.emit();
      this.cleanUpMessageSelection();
    }

    onMessagesListActionConfirmClicked() : void
    {
      this.onOptionPromptConfirmed.emit(this.selectedMessages);
      this.cleanUpMessageSelection();
    }
}
