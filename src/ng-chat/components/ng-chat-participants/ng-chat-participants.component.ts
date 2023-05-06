import { Component, Input, Output, EventEmitter, ViewEncapsulation, OnChanges, SimpleChanges } from '@angular/core';

import { IChatOption } from '../../core/chat-option';
import { IChatParticipant } from "../../core/chat-participant";
import { ChatParticipantStatus } from "../../core/chat-participant-status.enum";
import { chatParticipantStatusDescriptor } from '../../core/chat-participant-status-descriptor';
import { ChatUser } from "../../core/chat-user";
import { ChatWindow } from "../../core/chat-window";
import { Localization } from '../../core/localization';
import { MessageCounter } from "../../core/message-counter";
import { ParticipantResponse } from "../../core/participant-response";

@Component({
    selector: 'ng-chat-participants',
    templateUrl: './ng-chat-participants.component.html',
    styleUrls: ['./ng-chat-participants.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class NgChatParticipantsComponent implements OnChanges {
    constructor() { }

    @Input()
    public participants: IChatParticipant[];

    @Input()
    public participantsResponse: ParticipantResponse[];

    @Input()
    public participantsInteractedWith: IChatParticipant[] = [];

    @Input()
    public window: ChatWindow;

    @Input()
    public userId: any;

    @Input()
    public localization: Localization;

    @Input()
    public isCollapsed: boolean;

    @Input()
    public searchEnabled: boolean;

    @Input()
    public currentActiveOption: IChatOption | null;

    @Output()
    public onParticipantClicked: EventEmitter<IChatParticipant> = new EventEmitter();

    @Output()
    public onOptionPromptCanceled: EventEmitter<any> = new EventEmitter();

    @Output()
    public onOptionPromptConfirmed: EventEmitter<any> = new EventEmitter();

    public selectedUsersFromFriendsList: ChatUser[] = [];

    public searchInput: string = '';

    // Exposes enums and functions for the ng-template
    public ChatParticipantStatus = ChatParticipantStatus;
    public chatParticipantStatusDescriptor = chatParticipantStatusDescriptor;

    ngOnChanges(changes: SimpleChanges) {
        if (this.currentActiveOption) {
            const currentOptionTriggeredBy = this.currentActiveOption && this.currentActiveOption.chattingTo.participant.id;
            const isActivatedUserInSelectedList = (this.selectedUsersFromFriendsList.filter(item => item.id == currentOptionTriggeredBy)).length > 0;

            if (!isActivatedUserInSelectedList) {
                this.selectedUsersFromFriendsList = this.selectedUsersFromFriendsList
                  .concat(this.currentActiveOption.chattingTo.participant as ChatUser);
            }
        }
    }

    get filteredParticipants(): IChatParticipant[]
    {
        if (this.searchInput.length > 0){
            // Searches in the friend list by the inputted search string
            return this.participants.filter(x => x.displayName.toUpperCase().includes(this.searchInput.toUpperCase()));
        }

        return this.participants;
    }

    isUserSelectedFromFriendsList(user: ChatUser) : boolean
    {
        return (this.selectedUsersFromFriendsList.filter(item => item.id == user.id)).length > 0
    }

    unreadMessagesTotalByParticipant(participant: IChatParticipant): string
    {
        let openedWindow = this.window;

        if (openedWindow){
            return MessageCounter.unreadMessagesTotal(openedWindow, this.userId);
        }
        else
        {
            let totalUnreadMessages = this.participantsResponse
                .filter(x => x.participant.id == participant.id && !this.participantsInteractedWith.find(u => u.id == participant.id) && x.metadata && x.metadata.totalUnreadMessages > 0)
                .map((participantResponse) => {
                    return participantResponse.metadata.totalUnreadMessages
                })[0];

            return MessageCounter.formatUnreadMessagesTotal(totalUnreadMessages);
        }
    }

    cleanUpUserSelection = () => this.selectedUsersFromFriendsList = [];

    // Toggle friends list visibility
    onChatTitleClicked(): void
    {
        this.isCollapsed = !this.isCollapsed;
    }

    onFriendsListCheckboxChange(selectedUser: ChatUser, isChecked: boolean): void
    {
        if(isChecked) {
            this.selectedUsersFromFriendsList.push(selectedUser);
        }
        else
        {
            this.selectedUsersFromFriendsList.splice(this.selectedUsersFromFriendsList.indexOf(selectedUser), 1);
        }
    }

    onUserClick(clickedUser: ChatUser): void
    {
        this.onParticipantClicked.emit(clickedUser);
    }

    onFriendsListActionCancelClicked(): void
    {
        this.onOptionPromptCanceled.emit();
        this.cleanUpUserSelection();
    }

    onFriendsListActionConfirmClicked() : void
    {
        this.onOptionPromptConfirmed.emit(this.selectedUsersFromFriendsList);
        this.cleanUpUserSelection();
    }
}
