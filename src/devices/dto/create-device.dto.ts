export class CreateDeviceDto {
  name: string;
  description?: string;
  subGroupId?: string;
  policyId: string;
  certificateId?: string;
}
