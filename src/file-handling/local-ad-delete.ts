import { localDataPath } from '../utils';
import { readdirSync, rmSync } from 'fs';

export async function deleteAdLocally(adId: string) {
  const adPath = `${localDataPath}/pi`;

  console.log('🗑️ Deleting ad files for', adId);
  const files = readdirSync(adPath).filter(file => file.startsWith(adId));

  for (const file of files) {
    console.log('🗑️ Deleting ad file:', `${adPath}/${file}`);
    rmSync(`${adPath}/${file}`);
  }
}
