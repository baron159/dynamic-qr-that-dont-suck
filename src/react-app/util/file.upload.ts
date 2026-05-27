// Client helper for uploading a file to the worker's R2-backed multipart
// upload endpoints. Splits the file into 10 MB parts so a 1 GB file fits
// comfortably under the per-request size limits.

const PART_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_FILE_BYTES = 1024 * 1024 * 1024; // 1 GB

interface StartResponse { key: string; uploadId: string; url: string }
interface CompleteResponse { key: string; size: number; etag: string; url: string }
interface UploadedPart { partNumber: number; etag: string }

export interface UploadProgress {
    sentBytes: number;
    totalBytes: number;
    partNumber: number;
    totalParts: number;
}

export async function uploadFileMultipart(
    file: File,
    injectHeader: (req: Request) => void,
    onProgress?: (p: UploadProgress) => void,
): Promise<CompleteResponse> {
    if (file.size > MAX_FILE_BYTES) {
        throw new Error(`File is larger than the 1 GB limit (${file.size} bytes)`);
    }

    const startReq = new Request('/api/auth/files/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            size: file.size,
        }),
    });
    injectHeader(startReq);
    const startRes = await fetch(startReq);
    if (!startRes.ok) {
        const text = await startRes.text();
        throw new Error(`Failed to start upload: ${text || startRes.status}`);
    }
    const { key, uploadId } = await startRes.json() as StartResponse;

    const totalParts = Math.max(1, Math.ceil(file.size / PART_SIZE));
    const parts: UploadedPart[] = [];
    let sent = 0;

    try {
        for (let i = 0; i < totalParts; i++) {
            const partNumber = i + 1;
            const start = i * PART_SIZE;
            const end = Math.min(start + PART_SIZE, file.size);
            const slice = file.slice(start, end);
            const url = `/api/auth/files/part?key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}&partNumber=${partNumber}`;
            const partReq = new Request(url, { method: 'PUT', body: slice });
            injectHeader(partReq);
            const partRes = await fetch(partReq);
            if (!partRes.ok) {
                const msg = await partRes.text();
                throw new Error(`Part ${partNumber} failed: ${msg || partRes.status}`);
            }
            const uploaded = await partRes.json() as UploadedPart;
            parts.push(uploaded);
            sent += end - start;
            onProgress?.({ sentBytes: sent, totalBytes: file.size, partNumber, totalParts });
        }

        const completeReq = new Request('/api/auth/files/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, uploadId, parts }),
        });
        injectHeader(completeReq);
        const completeRes = await fetch(completeReq);
        if (!completeRes.ok) {
            const msg = await completeRes.text();
            throw new Error(`Failed to complete upload: ${msg || completeRes.status}`);
        }
        return await completeRes.json() as CompleteResponse;
    } catch (e) {
        try {
            const abortReq = new Request('/api/auth/files/abort', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, uploadId }),
            });
            injectHeader(abortReq);
            await fetch(abortReq);
        } catch {
            // best-effort cleanup
        }
        throw e;
    }
}
