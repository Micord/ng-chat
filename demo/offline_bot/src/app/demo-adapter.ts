import { ChatAdapter, Chat, Message, ChatParticipantStatus, ParticipantResponse,
  IChatParticipant, MessageType } from 'ng-chat';
import { Observable, of } from 'rxjs';
import { delay } from "rxjs/operators";

export class DemoAdapter extends ChatAdapter
{
    public static mockedParticipants: IChatParticipant[] = [
    {
        id: 1,
        displayName: "Arya Stark",
        status: ChatParticipantStatus.Online
    },
    {
        id: 2,
        displayName: "Cersei Lannister",
        status: ChatParticipantStatus.Online
    },
    {
        id: 3,
        displayName: "Daenerys Targaryen",
        status: ChatParticipantStatus.Busy
    },
    {
        id: 4,
        displayName: "Eddard Stark",
        status: ChatParticipantStatus.Offline
    },
    {
        id: 5,
        displayName: "Hodor",
        status: ChatParticipantStatus.Offline
    },
    {
        id: 6,
        displayName: "Jaime Lannister",
        status: ChatParticipantStatus.Busy
    },
    {
        id: 7,
        displayName: "John Snow",
        status: ChatParticipantStatus.Busy
    },
    {
        id: 8,
        displayName: "Lorde Petyr 'Littlefinger' Baelish",
        status: ChatParticipantStatus.Offline
    },
    {
        id: 9,
        displayName: "Sansa Stark",
        status: ChatParticipantStatus.Online
    },
    {
        id: 10,
        displayName: "Theon Greyjoy",
        status: ChatParticipantStatus.Away
    }];

    listFriends(): Observable<ParticipantResponse[]> {
        return of(DemoAdapter.mockedParticipants.map(user => {
            const participantResponse = new ParticipantResponse();

            participantResponse.participant = user;
            participantResponse.metadata = {
                totalUnreadMessages: Math.floor(Math.random() * 10)
            }

            return participantResponse;
        }));
    }

    getMessageHistory(destinataryId: any): Observable<Message[]> {
        let mockedHistory: Array<Message>;

        mockedHistory = [
            {
                fromId: MessageType.Text,
                toId: 999,
                message: "Hi there, here is a sample image type message:",
                dateSent: new Date()
            },
            {
              fromId: 1,
              toId: 999,
              type: MessageType.Image,
              message: "https://66.media.tumblr.com/avatar_9dd9bb497b75_128.pnj",
              dateSent: new Date()
            },
            {
                fromId: MessageType.Text,
                toId: 999,
                message: "Type any message bellow to test this Angular module.",
                dateSent: new Date()
            },
        ];

        return of(mockedHistory).pipe(delay(2000));
    }

    sendMessage(message: Message): void {
        setTimeout(() => {
            const replyMessage = new Message();

            replyMessage.message = "You have typed '" + message.message + "'";
            replyMessage.dateSent = new Date();
            if (isNaN(message.toId))
            {
                let chatGroup = DemoAdapter.mockedParticipants.find(x => x.id == message.toId) as Chat;

                // Message to a chatGroup. Pick up any participant for this
                replyMessage.fromId = chatGroup.id;

                replyMessage.toId = message.toId;

                this.onMessageReceived(chatGroup, replyMessage);
            }
            else
            {
                replyMessage.fromId = message.toId;
                replyMessage.toId = message.fromId;

                let user = DemoAdapter.mockedParticipants.find(x => x.id == replyMessage.fromId);

                this.onMessageReceived(user, replyMessage);
            }
        }, 1000);
    }
}
