import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class SeedanceApi implements ICredentialType {
  name = 'seedanceApi';

  displayName = 'Seedance API';

  documentationUrl = 'https://www.volcengine.com/docs/82379/1298459';

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
    },
  ];
}
