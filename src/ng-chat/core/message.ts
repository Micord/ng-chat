import { Attachment } from "./attachment";
import { MessageType } from "./message-type.enum";

export class Message
{
    public id?: any;
    public type?: MessageType = MessageType.Text;
    public fromId: any;
    public fromName?: string;
    public toId: any;
    public message: string;
    public dateSent?: Date;
    public dateSeen?: Date;
    public file?: Attachment;
    public isDeleted?: boolean;
}
