import { Observable } from 'rxjs';
import { Message } from "./message";
import { ParticipantResponse } from "./participant-response";
import { IChatParticipant } from './chat-participant';

export abstract class ChatAdapter
{
    // ### Abstract adapter methods ###

    public abstract listParticipants(): Observable<ParticipantResponse[]>;

    public abstract getMessageHistory(destinataryId: any): Observable<Message[]>;

    public abstract sendMessage(message: Message): void;

    // ### Adapter/Chat income/ingress events ###

    public onParticipantsListChanged(participantsResponse: ParticipantResponse[]): void
    {
        this.participantsListChangedHandler(participantsResponse);
    }

    public onMessageReceived(participant: IChatParticipant, message: Message): void
    {
        this.messageReceivedHandler(participant, message);
    }

    // Event handlers
    /** @internal */
    participantsListChangedHandler: (participantsResponse: ParticipantResponse[]) => void  = (participantsResponse: ParticipantResponse[]) => {};
    /** @internal */
    messageReceivedHandler: (participant: IChatParticipant, message: Message) => void = (participant: IChatParticipant, message: Message) => {};
}
