import { Chat, Message, PagedHistoryChatAdapter, ParticipantResponse } from 'ng-chat';
import { Observable, of } from 'rxjs';
import { DemoAdapter } from './demo-adapter';
import { delay } from "rxjs/operators";

export class DemoAdapterPagedHistory extends PagedHistoryChatAdapter
{
    private historyMessages: Message[] = [];

    constructor() {
        super();
        for(let i: number = 0; i < 20; i++) {
            let msg = {
                fromId: 1,
                toId: 999,
                message: `${20-i}. Hi there, just type any message bellow to test this Angular module.`,
                dateSent: new Date()
            };

            this.historyMessages.push(msg);
        }
    }

    listFriends(): Observable<ParticipantResponse[]> {
        return of(DemoAdapter.mockedParticipants.map(user => {
            let participantResponse = new ParticipantResponse();

            participantResponse.participant = user;
            participantResponse.metadata = {
                totalUnreadMessages: 4 // Demo history page size
            }

            return participantResponse;
        }));
    }

    getMessageHistory(destinataryId: any): Observable<Message[]> {
       let mockedHistory: Array<Message>;
       mockedHistory = [
            {
                fromId: 1,
                toId: 999,
                message: "Hi there, just type any message bellow to test this Angular module.",
                dateSent: new Date()
            }
       ];

       return of(mockedHistory);
    }

    public getMessageHistoryByPage(destinataryId: any, size: number, page: number) : Observable<Message[]> {
       let startPosition: number = (page - 1) * size;
       let endPosition: number = page * size;
       let mockedHistory: Array<Message> = this.historyMessages.slice(startPosition, endPosition);
       return of(mockedHistory.reverse()).pipe(delay(5000));
    }


    sendMessage(message: Message): void {
        setTimeout(() => {
            const replyMessage = new Message();

            replyMessage.message = 'You have typed \'' + message.message + '\'';
            replyMessage.dateSent = new Date();

            if (isNaN(message.toId))
            {
                const chatGroup = DemoAdapter.mockedParticipants.find(x => x.id === message.toId) as Chat;

                // Message to a chatGroup. Pick up any participant for this
                replyMessage.fromId = chatGroup.id;

                replyMessage.toId = message.toId;

                this.onMessageReceived(chatGroup, replyMessage);
            }
            else
            {
                replyMessage.fromId = message.toId;
                replyMessage.toId = message.fromId;

                const user = DemoAdapter.mockedParticipants.find(x => x.id === replyMessage.fromId);

                this.onMessageReceived(user, replyMessage);
            }

        }, 1000);
    }
}
