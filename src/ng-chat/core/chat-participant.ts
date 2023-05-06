import { ChatParticipantStatus } from "./chat-participant-status.enum";

export interface IChatParticipant {
    readonly id: any;
    readonly displayName: string;
    readonly status: ChatParticipantStatus;
}
