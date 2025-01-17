import {
  Component, EventEmitter, Input, HostListener, OnInit, Output, ViewChild, ViewEncapsulation,
  ChangeDetectorRef, OnDestroy
} from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { ChatAdapter } from './core/chat-adapter';
import { ParticipantResponse } from "./core/participant-response";
import { Message } from "./core/message";
import { MessageType } from "./core/message-type.enum";
import { ChatWindow } from "./core/chat-window";
import { ChatParticipantStatus } from "./core/chat-participant-status.enum";
import { ScrollDirection } from "./core/scroll-direction.enum";
import { Localization, StatusDescription } from './core/localization';
import { IChatController } from './core/chat-controller';
import { IFileUploadAdapter } from './core/file-upload-adapter';
import { Theme } from './core/theme.enum';
import { IChatOption } from './core/chat-option';
import { ChatOptionType } from "./core/chat-option-type.enum";
import { IChatParticipant } from "./core/chat-participant";

import { map } from 'rxjs/operators';
import { NgChatWindowComponent } from './components/ng-chat-window/ng-chat-window.component';

@Component({
    selector: 'ng-chat',
    templateUrl: 'ng-chat.component.html',
    styleUrls: [
        'assets/icons.css',
        'assets/loading-spinner.css',
        'assets/ng-chat.component.default.css',
        'assets/themes/ng-chat.theme.default.scss',
        'assets/themes/ng-chat.theme.dark.scss'
    ],
    encapsulation: ViewEncapsulation.None
})

export class NgChat implements OnInit, OnDestroy, IChatController {
    constructor(private _httpClient: HttpClient, private cdr: ChangeDetectorRef) { }

    // Exposes enums for the ng-template
    public ChatParticipantStatus = ChatParticipantStatus;

    private _isDisabled: boolean = false;

    get isDisabled(): boolean {
        return this._isDisabled;
    }

    @Input()
    set isDisabled(value: boolean) {
        this._isDisabled = value;

        if (value)
        {
            // To address issue https://github.com/rpaschoal/ng-chat/issues/120
            window.clearInterval(this.pollingIntervalWindowInstance)
        }
        else
        {
            this.activateParticipantListFetch();
        }
    }

    @Input()
    public chatAdapter: ChatAdapter;

    @Input()
    public userId: any;

    @Input()
    public isCollapsed: boolean = false;

    @Input()
    public maximizeWindowOnNewMessage: boolean = true;

    @Input()
    public pollParticipantsList: boolean = false;

    @Input()
    public pollingInterval: number = 60000;

    @Input()
    public historyEnabled: boolean = true;

    @Input()
    public emojisEnabled: boolean = true;

    @Input()
    public linkfyEnabled: boolean = true;

    @Input()
    public audioEnabled: boolean = false;

    @Input()
    public searchEnabled: boolean = true;

    @Input() // TODO: This might need a better content strategy
    public audioSource: string = 'https://raw.githubusercontent.com/rpaschoal/ng-chat/master/src/ng-chat/assets/notification.wav';

    @Input()
    public persistWindowsState: boolean = true;

    @Input()
    public title: string = "Participants";

    @Input()
    public messagePlaceholder: string = "Type a message";

    @Input()
    public searchPlaceholder: string = "Search";

    @Input()
    public sendMessageTitle: string = "Send message";

    @Input()
    public uploadFileTitle: string = "Upload file";

    @Input()
    public browserNotificationsEnabled: boolean = true;

    @Input() // TODO: This might need a better content strategy
    public browserNotificationIconSource: string = 'https://raw.githubusercontent.com/rpaschoal/ng-chat/master/src/ng-chat/assets/notification.png';

    @Input()
    public browserNotificationTitle: string = "New message from";

    @Input()
    public historyPageSize: number = 10;

    @Input()
    public localization: Localization;

    @Input()
    public showParticipantsList: boolean = true;

    @Input()
    public theme: Theme = Theme.Light;

    @Input()
    public customTheme: string;

    @Input()
    public messageDatePipeFormat: string = "dd.MM.yyyy HH:mm";

    @Input()
    public showMessageDate: boolean = true;

    @Input()
    public isViewportOnMobileEnabled: boolean = false;

    @Input()
    public fileUploadAdapter: IFileUploadAdapter;

    @Output()
    public onParticipantClicked: EventEmitter<IChatParticipant> = new EventEmitter<IChatParticipant>();

    @Output()
    public onParticipantChatOpened: EventEmitter<IChatParticipant> = new EventEmitter<IChatParticipant>();

    @Output()
    public onParticipantChatClosed: EventEmitter<IChatParticipant> = new EventEmitter<IChatParticipant>();

    @Output()
    public onMessagesSeen: EventEmitter<Message[]> = new EventEmitter<Message[]>();

    private browserNotificationsBootstrapped: boolean = false;

    public hasPagedHistory: boolean = false;

    // Don't want to add this as a setting to simplify usage. Previous placeholder and title
    // settings available to be used, or use full Localization object.
    private statusDescription: StatusDescription = {
        online: 'Online',
        busy: 'Busy',
        away: 'Away',
        offline: 'Offline'
    };

    private audioFile: HTMLAudioElement;

    public participants: IChatParticipant[];

    public participantsResponse: ParticipantResponse[];

    public participantsInteractedWith: IChatParticipant[] = [];

    public currentActiveMessageOption: IChatOption | null;
    public currentActiveParticipantOption: IChatOption | null;

    private pollingIntervalWindowInstance: number;

    private get localStorageKey(): string
    {
        return `ng-chat-users-${this.userId}`; // Appending the user id so the state is unique per user in a computer.
    };

    // Defines the size of each opened window to calculate how many windows can be opened on the viewport at the same time.
    public windowSizeFactor: number = 320;

    // Total width size of the participants list section
    public participantsListWidth: number = 262;

    // Available area to render the plugin
    private viewPortTotalArea: number;

    chatWindow: ChatWindow;
    isBootstrapped: boolean = false;

    @ViewChild('ngChatWindow') ngChatWindow: NgChatWindowComponent;

    ngOnInit() {
        this.bootstrapChat();
    }

    ngOnDestroy() {
      window.clearInterval(this.pollingIntervalWindowInstance);
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: any){
       this.viewPortTotalArea = event.target.innerWidth;
    }

    // Initializes the chat plugin and the messaging adapter
    private bootstrapChat(): void
    {
        let initializationException = null;

        if (this.chatAdapter != null && this.userId != null)
        {
            try
            {
                this.viewPortTotalArea = window.innerWidth;

                this.initializeTheme();
                this.initializeDefaultText();
                this.initializeBrowserNotifications();

                // Binding event listeners
                this.chatAdapter.chatWindowOpeningHandler =
                  (participant, messages) =>
                    this.onChatWindowOpening(participant, messages);
                this.chatAdapter.messageReceivedHandler =
                  (participant, message) =>
                    this.onMessageReceived(participant, message);
                this.chatAdapter.participantsListChangedHandler =
                  (participantsResponse) =>
                    this.onParticipantsListChanged(participantsResponse);

                this.activateParticipantListFetch();

                this.bufferAudioFile();

                this.hasPagedHistory = false;

                this.isBootstrapped = true;
            }
            catch(ex)
            {
                initializationException = ex;
            }
        }

        if (!this.isBootstrapped){
            console.error("ng-chat component couldn't be bootstrapped.");

            if (this.userId == null){
                console.error("ng-chat can't be initialized without an user id. Please make sure you've provided an userId as a parameter of the ng-chat component.");
            }
            if (this.chatAdapter == null){
                console.error("ng-chat can't be bootstrapped without a ChatAdapter. Please make sure you've provided a ChatAdapter implementation as a parameter of the ng-chat component.");
            }
            if (initializationException)
            {
                console.error(`An exception has occurred while initializing ng-chat. Details: ${initializationException.message}`);
                console.error(initializationException);
            }
        }
    }

    private activateParticipantListFetch(): void {
        if (this.chatAdapter)
        {
            // Loading current users list
            this.fetchParticipantsList(true);
            if (this.pollParticipantsList){
                // Setting a long poll interval to update the participants list
                this.pollingIntervalWindowInstance = window
                  .setInterval(() => {
                    if (!this.chatAdapter.isSessionActive()) {
                      window.clearInterval(this.pollingIntervalWindowInstance);
                      return;
                    }
                    this.fetchParticipantsList(false)
                  }, this.pollingInterval);
            }
            // Since polling was disabled, a participants list update mechanism will have
            // to be implemented in the ChatAdapter.
        }
    }

    // Initializes browser notifications
    private async initializeBrowserNotifications()
    {
        if (this.browserNotificationsEnabled && ("Notification" in window))
        {
            if (await Notification.requestPermission() === "granted")
            {
                this.browserNotificationsBootstrapped = true;
            }
        }
    }

    // Initializes default text
    private initializeDefaultText() : void
    {
        if (!this.localization)
        {
            this.localization = {
                messagePlaceholder: this.messagePlaceholder,
                searchPlaceholder: this.searchPlaceholder,
                sendMessageTitle: this.sendMessageTitle,
                uploadFileTitle: this.uploadFileTitle,
                title: this.title,
                statusDescription: this.statusDescription,
                browserNotificationTitle: this.browserNotificationTitle,
                loadMessageHistoryPlaceholder: "Load older messages"
            };
        }
    }

    private initializeTheme(): void
    {
        if (this.customTheme)
        {
            this.theme = Theme.Custom;
        }
        else if (this.theme != Theme.Light && this.theme != Theme.Dark)
        {
            // TODO: Use es2017 in future with Object.values(Theme).includes(this.theme) to do this check
            throw new Error(`Invalid theme configuration for ng-chat. "${this.theme}" is not a valid theme value.`);
        }
    }

    // Sends a request to load the participants list
    private fetchParticipantsList(isBootstrapping: boolean): void
    {
        this.chatAdapter.listParticipants()
        .pipe(
            map((participantsResponse: ParticipantResponse[]) => {
                this.participantsResponse = participantsResponse;

                this.participants = participantsResponse
                  .map((response: ParticipantResponse) => response.participant);
            })
        ).subscribe(() => {
        });
    }

    fetchMessageHistory(window: ChatWindow) {
        this.chatAdapter.getMessageHistory()
        .pipe(
            map((result: Message[]) => {
                result.forEach((message : Message) => this.assertMessageType(message));

                window.messages = this.hasPagedHistory ? result.concat(window.messages) : result;
                window.isLoadingHistory = false;

                setTimeout(() =>
                    this.onFetchMessageHistoryLoaded(result, window, ScrollDirection.Bottom));
            })
        ).subscribe();
    }

    private onFetchMessageHistoryLoaded(messages: Message[], window: ChatWindow,
                                        direction: ScrollDirection,
                                        forceMarkMessagesAsSeen: boolean = false): void
    {
        this.scrollChatWindow(window, direction)

        if (window.hasFocus || forceMarkMessagesAsSeen)
        {
            const unseenMessages = messages.filter(m => !m.dateSeen);

            this.markMessagesAsRead(unseenMessages);
        }
    }

    // Updates the participants list via the event handler
    private onParticipantsListChanged(participantsResponse: ParticipantResponse[]): void
    {
        if (participantsResponse)
        {
            this.participantsResponse = participantsResponse;

            this.participants = participantsResponse.map((response: ParticipantResponse) => {
                return response.participant;
            });

            this.participantsInteractedWith = [];
        }
    }

    private onChatWindowOpening(participant: IChatParticipant, messages: Message[])
    {
        if (participant && messages)
        {
            const chatWindow = this.openChatWindow(participant);
            chatWindow[0].messages= messages;
            this.scrollChatWindow(chatWindow[0], ScrollDirection.Bottom);
        }
    }

    // Handles received messages by the adapter
    private onMessageReceived(participant: IChatParticipant, message: Message)
    {
        if (participant && message)
        {
            const chatWindow = this.openChatWindow(participant);

            this.assertMessageType(message);

            if (!chatWindow[1] || !this.historyEnabled){
                chatWindow[0].messages.push(message);

                this.scrollChatWindow(chatWindow[0], ScrollDirection.Bottom);

                if (chatWindow[0].hasFocus && !chatWindow[0].isCollapsed)
                {
                    this.markMessagesAsRead([message]);
                }
            }

            this.emitMessageSound(chatWindow[0]);

            // Github issue #58
            // Do not push browser notifications with message content for privacy purposes
            // if the 'maximizeWindowOnNewMessage' setting is off and this is a new chat window.
            if (this.maximizeWindowOnNewMessage || (!chatWindow[1] && !chatWindow[0].isCollapsed))
            {
                // Some messages are not pushed because they are loaded by fetching the history hence why we supply the message here
                this.emitBrowserNotification(chatWindow[0], message);
            }
        }
    }

    onParticipantClickedFromParticipantsList(participant: IChatParticipant): void {
        this.openChatWindow(participant, true, true);
    }

    private cancelOptionPrompt(): void {
        if (this.currentActiveMessageOption)
        {
            this.currentActiveMessageOption.isActive = false;
            this.currentActiveMessageOption = null;
        }
        if (this.currentActiveParticipantOption)
        {
            this.currentActiveParticipantOption.isActive = false;
            this.currentActiveParticipantOption = null;
        }
    }

    onOptionPromptCanceled(): void {
        this.cancelOptionPrompt();
    }

    onOptionPromptConfirmed(messages: Message[]): void {
        // For now this is fine as there is only one option available.
        // Introduce option types and type checking if a new option is added.
        this.chatAdapter.deleteMessages(messages)
          .then(() => this.cdr.detectChanges());
        // Canceling current state
        this.cancelOptionPrompt();
    }

    // Opens a new chat window. Takes care of available viewport
    // Works for opening a chat window for an user or for a group
    // Returns => [Window: Window object reference, boolean: Indicates if this window is a new chat window]
    private openChatWindow(participant: IChatParticipant, focusOnNewWindow: boolean = false,
                           invokedByUserClick: boolean = false): [ChatWindow, boolean]
    {
        // Is this window opened?
        const openedWindow = this.chatWindow;

        if (!openedWindow || openedWindow.participant.id != participant.id)
        {
            if (invokedByUserClick)
            {
                this.onParticipantClicked.emit(participant);
            }

            // Refer to issue #58 on Github
            const collapseWindow = invokedByUserClick ? false : !this.maximizeWindowOnNewMessage;

            const newChatWindow: ChatWindow = new ChatWindow(participant, this.historyEnabled, collapseWindow);

            // Loads the chat history via an RxJs Observable
            if (this.historyEnabled)
            {
                this.fetchMessageHistory(newChatWindow);
            }

            this.chatWindow = newChatWindow;

            if (focusOnNewWindow && !collapseWindow)
            {
                this.focusOnWindow(newChatWindow);
            }

            this.participantsInteractedWith.push(participant);
            this.onParticipantChatOpened.emit(participant);

            return [newChatWindow, true];
        }
        else
        {
            // Returns the existing chat window
            return [openedWindow, false];
        }
    }

    // Focus on the input element of the supplied window
    private focusOnWindow(window: ChatWindow, callback: Function = () => {}) : void
    {
            setTimeout(() => {
                if (this.ngChatWindow)
                {
                    const chatWindowToFocus = this.ngChatWindow;

                    chatWindowToFocus.chatWindowInput.nativeElement.focus();
                }

                callback();
            });
    }

    private assertMessageType(message: Message): void {
        // Always fallback to "Text" messages to avoid rendering issues
        if (!message.type)
        {
            message.type = MessageType.Text;
        }
    }

    // Marks all messages provided as read with the current time.
    markMessagesAsRead(messages: Message[]): void
    {
        const currentDate = new Date();

        messages.forEach((msg)=>{
            msg.dateSeen = currentDate;
        });

        this.onMessagesSeen.emit(messages);
    }

    // Buffers audio file (For component's bootstrapping)
    private bufferAudioFile(): void {
        if (this.audioSource && this.audioSource.length > 0)
        {
            this.audioFile = new Audio();
            this.audioFile.src = this.audioSource;
            this.audioFile.load();
        }
    }

    // Emits a message notification audio if enabled after every message received
    private emitMessageSound(window: ChatWindow): void
    {
        if (this.audioEnabled && !window.hasFocus && this.audioFile) {
            this.audioFile.play();
        }
    }

    // Emits a browser notification
    private emitBrowserNotification(chatWindow: ChatWindow, message: Message): void
    {
        if (this.browserNotificationsBootstrapped && !chatWindow.hasFocus && message) {
            const notification =
              new Notification(`${this.localization.browserNotificationTitle} ${chatWindow.participant.displayName}`,
                               {'body': message.message, 'icon': this.browserNotificationIconSource});

            setTimeout(() => {
                notification.close();
            }, message.message.length <= 50 ? 5000 : 7000); // More time to read longer messages
        }
    }

    // Scrolls a chat window message flow to the bottom
    private scrollChatWindow(window: ChatWindow, direction: ScrollDirection): void
    {
        if (this.ngChatWindow){
          this.ngChatWindow.scrollChatWindow(window, direction);
        }
    }

    onWindowMessagesSeen(messagesSeen: Message[]): void {
        this.markMessagesAsRead(messagesSeen);
    }

    onWindowMessageSent(messageSent: Message): void {
        this.chatAdapter.sendMessage(messageSent);
    }

    onWindowOptionTriggered(option: IChatOption): void {
        if (option.type == ChatOptionType.Message) {
            this.currentActiveMessageOption = option;
        }
        else if (option.type == ChatOptionType.Participant) {
            this.currentActiveParticipantOption = option;
        }
    }

    triggerToggleChatWindowVisibility(): void {
        if (this.chatWindow && this.ngChatWindow){
            this.ngChatWindow.onChatWindowClicked(this.chatWindow);
        }
    }

    onDeleteMessage(message: Message): void {
      if (message) {
        this.chatAdapter.deleteMessages([message])
          .then(() => this.cdr.detectChanges());
      }
    }
}
