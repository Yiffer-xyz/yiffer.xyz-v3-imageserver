import { Request, Response } from 'express';
import { deleteGenericFileLocally, renameFileLocally } from './local-file-delete';

// Expand this as needed
type LocalDevManageFilesBody = {
  deletes: { path: string }[];
  renames: { oldPath: string; newPath: string }[];
};

export async function handleLocalDevManageFiles(req: Request, res: Response) {
  if (process.env.LOCAL_DEV !== 'true') {
    return res.status(400).send('Only available in local dev');
  }

  const actions = req.body as LocalDevManageFilesBody;

  for (const action of actions.deletes) {
    await deleteGenericFileLocally(action.path);
    console.log(`Deleted ${action.path}`);
  }

  for (const action of actions.renames) {
    await renameFileLocally(action.oldPath, action.newPath);
    console.log(`Renamed ${action.oldPath} to ${action.newPath}`);
  }

  return res.status(200).send('Files managed');
}
