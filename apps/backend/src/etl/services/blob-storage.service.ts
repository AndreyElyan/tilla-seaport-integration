import { AnonymousCredential, ContainerClient } from "@azure/storage-blob";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class BlobStorageService {
  private readonly logger = new Logger(BlobStorageService.name);

  async downloadExcelFiles(sasUrl: string): Promise<Buffer[]> {
    this.logger.log(`Starting download of Excel files from SAS URL: ${sasUrl}`);
    const containerClient = new ContainerClient(
      sasUrl,
      new AnonymousCredential(),
    );

    const buffers: Buffer[] = [];

    for await (const blob of containerClient.listBlobsFlat()) {
      if (!blob.name.endsWith(".xlsx")) {
        this.logger.warn(`Skipping non-Excel file: ${blob.name}`);
        continue;
      }

      this.logger.log(`Downloading blob: ${blob.name}`);

      const blobClient = containerClient.getBlobClient(blob.name);
      const response = await blobClient.download(0);

      const chunks: Buffer[] = [];

      const readableStream = response.readableStreamBody;

      if (!readableStream) {
        this.logger.error(
          `Failed to get readable stream for blob: ${blob.name}`,
        );
        continue;
      }

      for await (const chunk of readableStream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      buffers.push(Buffer.concat(chunks));
      this.logger.log(`Finished downloading blob: ${blob.name}`);
    }

    if (buffers.length === 0) {
      this.logger.warn(`No Excel files found at SAS URL: ${sasUrl}`);
    }

    return buffers;
  }
}
