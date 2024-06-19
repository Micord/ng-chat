import { Pipe, PipeTransform } from '@angular/core';
import { IChatParticipant } from "../core/chat-participant";
import { Message } from "../core/message";

/*
 * Renders the display name of a participant in a group based on who's sent the message
*/
@Pipe({name: 'groupMessageDisplayName'})
export class GroupMessageDisplayNamePipe implements PipeTransform {
    transform(participant: IChatParticipant, message: Message): string {
        return participant && message.fromName ? message.fromName : "";
    }
}
