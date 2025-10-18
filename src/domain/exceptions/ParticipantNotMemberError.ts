export class ParticipantNotMemberError extends Error {
  constructor(participantId: string) {
    super(
      `Participant with ID ${participantId} is not a member of this group.`,
    );
    this.name = "ParticipantNotMemberError";
  }
}
