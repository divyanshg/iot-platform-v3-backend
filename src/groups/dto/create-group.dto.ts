export class CreateGroupDto {
  name: string;
  description?: string;
}

export class CreateSubgrpDTO {
  name: string;
  description?: string;
  groupId: string;
}
