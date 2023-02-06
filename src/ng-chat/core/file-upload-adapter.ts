import { Observable } from 'rxjs';
import { Message } from './message';

export interface IFileUploadAdapter
{
    downloadFile(message: Message): void;
    uploadFile(file: File, participantId: any): Observable<Message>;
}
