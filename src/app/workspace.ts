import { DexieWorkspaceRepository } from '../infrastructure/db/repositories';
import { WorldMemoriesDb } from '../infrastructure/db/worldMemoriesDb';

const db = new WorldMemoriesDb();

export const workspaceRepository = new DexieWorkspaceRepository(db);
