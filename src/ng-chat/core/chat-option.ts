import { ChatOptionType } from './chat-option-type.enum';
import { IChatParticipant } from './chat-participant';
import { ChatWindow } from './chat-window';
import { Message } from "./message";

export interface IChatOption
{
    type: ChatOptionType;
    isActive: boolean;
    displayLabel: string;
    chattingTo: ChatWindow;
    action?: (chattingTo: ChatWindow) => void;
    validateMessageContext: (message: Message) => boolean;
    validateParticipantContext: (participant: IChatParticipant) => boolean;
}
