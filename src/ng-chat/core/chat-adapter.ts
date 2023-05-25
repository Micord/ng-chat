import { Observable } from 'rxjs';
import { Message } from "./message";
import { ParticipantResponse } from "./participant-response";
import { IChatParticipant } from './chat-participant';

export abstract class ChatAdapter
{
    // ### Abstract adapter methods ###

    public abstract listParticipants(): Observable<ParticipantResponse[]>;

    public abstract getMessageHistory(): Observable<Message[]>;

    public abstract sendMessage(message: Message): void;

    public abstract deleteMessages(messages: Message[]): void;

    // ### Adapter/Chat income/ingress events ###

    public onChatWindowOpening(participant: IChatParticipant, messages: Message[]): void
    {
        this.chatWindowOpeningHandler(participant, messages);
    }

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
    chatWindowOpeningHandler: (participant: IChatParticipant, messages: Message[]) =>
      void  = (participant: IChatParticipant, messages: Message[]) => {};
    /** @internal */
    participantsListChangedHandler: (participantsResponse: ParticipantResponse[]) =>
      void  = (participantsResponse: ParticipantResponse[]) => {};
    /** @internal */
    messageReceivedHandler: (participant: IChatParticipant, message: Message) =>
      void = (participant: IChatParticipant, message: Message) => {};
}
