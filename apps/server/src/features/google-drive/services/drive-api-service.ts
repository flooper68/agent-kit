const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

interface DriveFileResponse {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

interface DriveErrorResponse {
  error?: {
    code: number;
    message: string;
    status?: string;
  };
}

export class DriveApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public isRetryable: boolean
  ) {
    super(message);
    this.name = 'DriveApiError';
  }
}

/**
 * Service for interacting with Google Drive API
 */
export class DriveApiService {
  /**
   * Create a new file in Google Drive
   */
  async createFile(
    accessToken: string,
    folderId: string,
    fileName: string,
    content: string,
    mimeType: string = 'text/markdown'
  ): Promise<DriveFile> {
    // Use multipart upload for files with content
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      mimeType,
      parents: [folderId],
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      content +
      closeDelimiter;

    const response = await fetch(
      `${UPLOAD_API_BASE}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    await this.handleError(response);

    const data = (await response.json()) as DriveFileResponse;
    return {
      id: data.id,
      name: data.name,
      mimeType: data.mimeType,
      webViewLink: data.webViewLink,
    };
  }

  /**
   * Update an existing file's content
   */
  async updateFile(
    accessToken: string,
    fileId: string,
    content: string,
    mimeType: string = 'text/markdown'
  ): Promise<DriveFile> {
    const response = await fetch(
      `${UPLOAD_API_BASE}/files/${fileId}?uploadType=media&fields=id,name,mimeType,webViewLink`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': mimeType,
        },
        body: content,
      }
    );

    await this.handleError(response);

    const data = (await response.json()) as DriveFileResponse;
    return {
      id: data.id,
      name: data.name,
      mimeType: data.mimeType,
      webViewLink: data.webViewLink,
    };
  }

  /**
   * Update a file's metadata (e.g., name)
   */
  async updateFileMetadata(
    accessToken: string,
    fileId: string,
    metadata: { name?: string }
  ): Promise<DriveFile> {
    const response = await fetch(
      `${DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType,webViewLink`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      }
    );

    await this.handleError(response);

    const data = (await response.json()) as DriveFileResponse;
    return {
      id: data.id,
      name: data.name,
      mimeType: data.mimeType,
      webViewLink: data.webViewLink,
    };
  }

  /**
   * Delete a file from Google Drive
   */
  async deleteFile(accessToken: string, fileId: string): Promise<void> {
    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // 404 is acceptable - file may already be deleted
    if (response.status === 404) {
      return;
    }

    await this.handleError(response);
  }

  /**
   * Get file metadata
   */
  async getFile(accessToken: string, fileId: string): Promise<DriveFile | null> {
    const response = await fetch(
      `${DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType,webViewLink`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status === 404) {
      return null;
    }

    await this.handleError(response);

    const data = (await response.json()) as DriveFileResponse;
    return {
      id: data.id,
      name: data.name,
      mimeType: data.mimeType,
      webViewLink: data.webViewLink,
    };
  }

  /**
   * Handle API errors
   */
  private async handleError(response: Response): Promise<void> {
    if (response.ok) {
      return;
    }

    let errorMessage = `Drive API error: ${response.status}`;
    let isRetryable = false;

    try {
      const errorData = (await response.json()) as DriveErrorResponse;
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      // Ignore JSON parsing errors
    }

    // Determine if error is retryable
    switch (response.status) {
      case 429: // Rate limit
      case 500: // Internal server error
      case 502: // Bad gateway
      case 503: // Service unavailable
      case 504: // Gateway timeout
        isRetryable = true;
        break;
      case 401: // Unauthorized - token may need refresh
        isRetryable = true;
        errorMessage = 'Access token expired or invalid';
        break;
      case 403: // Forbidden - quota exceeded or permission denied
        // Check if it's a quota error (retryable) or permission error (not retryable)
        if (
          errorMessage.toLowerCase().includes('quota') ||
          errorMessage.toLowerCase().includes('rate')
        ) {
          isRetryable = true;
        }
        break;
    }

    throw new DriveApiError(errorMessage, response.status, isRetryable);
  }
}
