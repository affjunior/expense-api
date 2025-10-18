import { Group } from "@domain/entities/group";
import { GroupID } from "@domain/types/types";

export interface IGroupRepository {
  /**
   * Finds a group by its ID
   * @param id - The group ID
   * @returns The group if found, null otherwise
   */
  findById(id: GroupID): Promise<Group | null>;

  /**
   * Saves a group (create or update)
   * @param group - The group to save
   * @returns The saved group
   */
  save(group: Group): Promise<Group>;

  /**
   * Deletes a group by its ID
   * @param id - The group ID
   * @returns True if deleted, false if not found
   */
  delete(id: GroupID): Promise<boolean>;

  /**
   * Checks if a group exists
   * @param id - The group ID
   * @returns True if exists, false otherwise
   */
  exists(id: GroupID): Promise<boolean>;
}
