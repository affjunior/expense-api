import { Member } from "@domain/entities/member";
import { MemberID, GroupID } from "@domain/types/types";

export interface IMemberRepository {
  /**
   * Finds all members in a group
   * @param groupId - The group ID
   * @returns Array of members in the group
   */
  findByGroupId(groupId: GroupID): Promise<Member[]>;

  /**
   * Saves a member (create or update)
   * @param member - The member to save
   * @param groupId - The group ID the member belongs to
   * @returns The saved member
   */
  save(member: Member, groupId: GroupID): Promise<Member>;

  /**
   * Deletes a member by its ID
   * @param id - The member ID
   * @param groupId - The group ID
   * @returns True if deleted, false if not found
   */
  delete(id: MemberID, groupId: GroupID): Promise<boolean>;

  /**
   * Checks if a member exists
   * @param id - The member ID
   * @returns True if exists, false otherwise
   */
  exists(id: MemberID): Promise<boolean>;
}
