import { Request, Response } from 'express';
import { deleteGenericFileLocally, renameFileLocally } from './local-file-delete';
import { R2_PROFILE_PHOTOS_FOLDER, R2_TEMP_PICTURES_FOLDER } from '../constants';

// Expand this as needed
type LocalDevManageFilesBody = {
  deletes: { fileKind: 'profile-picture'; token: string }[];
  renames: { fileKind: 'profile-picture'; oldToken: string; newToken: string }[];
};

export async function handleLocalDevManageFiles(req: Request, res: Response) {
  if (process.env.LOCAL_DEV !== 'true') {
    return res.status(400).send('Only available in local dev');
  }

  const actions = req.body as LocalDevManageFilesBody;

  for (const action of actions.deletes) {
    if (action.fileKind === 'profile-picture') {
      await deleteGenericFileLocally(action.token + '.jpg');
      await deleteGenericFileLocally(action.token + '.webp');
      console.log(`Deleted profile picture ${action.token}`);
    }
  }

  for (const action of actions.renames) {
    if (action.fileKind === 'profile-picture') {
      await renameFileLocally(
        `${R2_TEMP_PICTURES_FOLDER}/${action.oldToken}.jpg`,
        `${R2_PROFILE_PHOTOS_FOLDER}/${action.newToken}.jpg`
      );
      await renameFileLocally(
        `${R2_TEMP_PICTURES_FOLDER}/${action.oldToken}.webp`,
        `${R2_PROFILE_PHOTOS_FOLDER}/${action.newToken}.webp`
      );
      console.log(`Renamed profile picture ${action.oldToken} to ${action.newToken}`);
    }
  }

  return res.status(200).send('Files managed');
}
