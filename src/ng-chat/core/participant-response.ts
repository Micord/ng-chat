import { IChatParticipant } from "./chat-participant";
import { ParticipantMetadata } from "./participant-metadata";

export class ParticipantResponse
{
    public participant: IChatParticipant;
    public metadata: ParticipantMetadata;
}
