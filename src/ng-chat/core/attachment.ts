export class Attachment
{
    public fileName: string;
    public mimeType: string;
    public fileSizeInBytes: number = 0;
    public downloadUrl?: string;
    public previewSrc?: string;
}
