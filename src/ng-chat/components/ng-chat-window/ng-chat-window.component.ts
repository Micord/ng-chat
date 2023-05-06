import { Component, Input, Output, EventEmitter, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';

import { Message } from "../../core/message";
import { MessageType } from "../../core/message-type.enum";
import { ChatWindow } from "../../core/chat-window";
import { ChatParticipantStatus } from "../../core/chat-participant-status.enum";
import { ScrollDirection } from "../../core/scroll-direction.enum";
import { Localization } from '../../core/localization';
import { IFileUploadAdapter } from '../../core/file-upload-adapter';
import { IChatOption } from '../../core/chat-option';
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
    public onMessagesSeen: EventEmitter<Message[]> = new EventEmitter();

    @Output()
    public onMessageSent: EventEmitter<Message> = new EventEmitter();

    @Output()
    public onOptionTriggered: EventEmitter<IChatOption> = new EventEmitter();

    @Output()
    public onLoadHistoryTriggered: EventEmitter<ChatWindow> = new EventEmitter();

    @ViewChild('chatMessages') chatMessages: any;
    @ViewChild('nativeFileInput') nativeFileInput: ElementRef;
    @ViewChild('chatWindowInput') chatWindowInput: any;

    // File upload state
    public fileUploadersInUse: string[] = []; // Id bucket of uploaders in use

    // Exposes enums and functions for the ng-template
    public ChatParticipantStatus = ChatParticipantStatus;
    public MessageType = MessageType;
    public chatParticipantStatusDescriptor = chatParticipantStatusDescriptor;

    defaultWindowOptions(currentWindow: ChatWindow): IChatOption[]
    {
            return [{
                isActive: false,
                chattingTo: currentWindow,
                validateContext: (participant: IChatParticipant) => {
                    return !!participant;
                },
                displayLabel: 'Add People' // TODO: Localize this
            }];
    }

    // Asserts if a user avatar is visible in a chat cluster
    isAvatarVisible(window: ChatWindow, message: Message, index: number): boolean
    {
        if (message.fromId != this.userId){
            if (index == 0){
                return true; // First message, good to show the thumbnail
            }
            else{
                // Check if the previous message belongs to the same user, if it belongs there is no need to show the avatar again to form the message cluster
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

    markMessagesAsRead(messages: Message[]): void
    {
        this.onMessagesSeen.emit(messages);
    }

    fetchMessageHistory(window: ChatWindow): void {
        this.onLoadHistoryTriggered.emit(window);
    }

    /*  Monitors pressed keys on a chat window
        - Dispatches a message when the ENTER key is pressed
        - Tabs between windows on TAB or SHIFT + TAB
        - Closes the current focused window on ESC
    */
   onChatInputTyped(event: any, window: ChatWindow): void
   {
       switch (event.keyCode)
       {
           case 13:
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
               break;
           case 9:
               event.preventDefault();

               break;
           case 27:
               break;
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
}
