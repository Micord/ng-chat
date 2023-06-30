import { IChatParticipant } from "./chat-participant";
import { ChatParticipantStatus } from "./chat-participant-status.enum";

export class ChatUser implements IChatParticipant
{
    public id: any;
    public displayName: string;
    public status: ChatParticipantStatus;
}
