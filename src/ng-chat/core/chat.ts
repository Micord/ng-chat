import { Guid } from "./guid";
import { IChatParticipant } from "./chat-participant";
import { ChatParticipantStatus } from "./chat-participant-status.enum";

export class Chat implements IChatParticipant
{
    public id: string = Guid.newGuid();
    public displayName: string;
    public status: ChatParticipantStatus = ChatParticipantStatus.Online;
}
