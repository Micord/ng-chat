import { IChatParticipant } from './chat-participant';
import { ChatWindow } from './chat-window';

export interface IChatOption
{
    isActive: boolean;
    displayLabel: string;
    chattingTo: ChatWindow;
    action?: (chattingTo: ChatWindow) => void;
    validateContext: (participant: IChatParticipant) => boolean;
}
