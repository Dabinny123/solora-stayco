// Admin Controls Service for Solora StayCo
import {
  createDocument,
  updateDocument,
  deleteDocument,
  getDocument,
  getDocuments,
} from '../firebase/firestoreService.js';

const COLLECTION_NAME = 'adminControls';

/**
 * Upsert an admin control entry
 * @param {string} controlType
 * @param {Object} data
 * @param {string} adminId
 * @returns {Promise<string>} Document ID
 */
export async function upsertAdminControl(controlType, data, adminId) {
  // Try to find existing document for the type
  const existing = await getDocuments(
    COLLECTION_NAME,
    [{ field: 'type', operator: '==', value: controlType }],
    'updatedAt',
    'desc',
    1
  );

  if (existing.length) {
    await updateDocument(COLLECTION_NAME, existing[0].id, {
      data,
      updatedAt: new Date().toISOString(),
      updatedBy: adminId,
    });
    return existing[0].id;
  }

  return await createDocument(COLLECTION_NAME, {
    type: controlType,
    data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: adminId,
    updatedBy: adminId,
  });
}

/**
 * Get admin control by type
 * @param {string} controlType
 * @returns {Promise<Object|null>}
 */
export async function getAdminControl(controlType) {
  const docs = await getDocuments(
    COLLECTION_NAME,
    [{ field: 'type', operator: '==', value: controlType }],
    'updatedAt',
    'desc',
    1
  );
  return docs[0] || null;
}

/**
 * Delete admin control by document ID
 * @param {string} controlId
 */
export async function deleteAdminControl(controlId) {
  return await deleteDocument(COLLECTION_NAME, controlId);
}

/**
 * List admin controls
 * @param {string|null} controlType
 * @returns {Promise<Array>}
 */
export async function listAdminControls(controlType = null) {
  const filters = controlType ? [{ field: 'type', operator: '==', value: controlType }] : [];
  return await getDocuments(COLLECTION_NAME, filters, 'updatedAt', 'desc');
}

