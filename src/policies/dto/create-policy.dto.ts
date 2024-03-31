export class CreatePolicyDto {
  name: string;
  description?: string;
  devices: string[];
  allowConnect: boolean;
  publishTopics: string[];
  subscribeTopics: string[];
}
