import type { ServerConfig } from "../config.js";
import type { AuthService } from "../auth/service.js";
import type { GameRepository } from "../persistence/types.js";
import type { TurnPersistenceAdapter } from "../persistence/turn-store.js";

export interface RoomDependencies { auth: AuthService; repository: GameRepository; turnPersistence: TurnPersistenceAdapter; config: ServerConfig }
let dependencies: RoomDependencies | null = null;
export function installRoomDependencies(value: RoomDependencies): void { dependencies = value; }
export function roomDependencies(): RoomDependencies { if (!dependencies) throw new Error("Room dependencies were not installed"); return dependencies; }
