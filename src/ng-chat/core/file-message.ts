import { Attachment } from "./attachment";
import { Message } from "./message";
import { MessageType } from "./message-type.enum";

export class FileMessage extends Message
{
    readonly type = MessageType.File;
    readonly file = new Attachment();
}
