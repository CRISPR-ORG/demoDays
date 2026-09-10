import { Readable } from 'node:stream';
import { config } from '../config.js';
import { getGoogleClients } from './googleAuth.js';

/**
 * Uploads the presentation into the configured Drive folder.
 *
 * Note on quotas: a service account owns the files it creates and has no Drive
 * storage of its own, so uploading into a personal "My Drive" folder fails with
 * a storageQuotaExceeded error. Either put the folder in a Shared Drive or use
 * the OAuth credentials mode (see server/.env.example).
 */
export async function uploadPresentation({ buffer, mimeType, fileName }) {
  const clients = getGoogleClients();
  if (!clients || !config.google.driveFolderId) {
    return { uploaded: false, reason: 'not-configured' };
  }

  const response = await clients.drive.files.create({
    requestBody: {
      name: fileName,
      parents: [config.google.driveFolderId],
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: 'id, name, webViewLink',
    supportsAllDrives: config.google.isSharedDrive,
  });

  return {
    uploaded: true,
    fileId: response.data.id,
    fileName: response.data.name,
    link: response.data.webViewLink,
  };
}
