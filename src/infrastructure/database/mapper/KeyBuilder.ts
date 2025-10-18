export const KeyBuilder = {
  groupPK: (groupId: string): `GROUP#${string}` => `GROUP#${groupId}`,
  groupSK: (): "METADATA" => "METADATA",
  memberSK: (memberId: string): `MEMBER#${string}` => `MEMBER#${memberId}`,
  expenseSK: (expenseId: string): `EXPENSE#${string}` => `EXPENSE#${expenseId}`,

  extractGroupId: (pk: string): string => pk.replace("GROUP#", ""),
  extractMemberId: (sk: string): string => sk.replace("MEMBER#", ""),
  extractExpenseId: (sk: string): string => sk.replace("EXPENSE#", ""),
};
