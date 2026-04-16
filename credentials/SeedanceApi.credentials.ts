import type { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class SeedanceApi implements ICredentialType {
  name = 'seedanceApi';

  displayName = 'Seedance API';

  documentationUrl = 'https://www.volcengine.com/docs/82379/1298459';

  icon: Icon = {
    light: 'file:seedance.svg',
    dark: 'file:seedance.svg',
  };

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      description: 'Volcengine Ark API Key used to authenticate Seedance requests',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
    },
  ];
}
