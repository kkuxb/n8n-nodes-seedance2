import type { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class SeedanceApi implements ICredentialType {
  name = 'seedanceApi';

  displayName = 'Seedance API';

  extends = ['httpHeaderAuth'];

  documentationUrl = 'https://www.volcengine.com/docs/82379/1298459';

  testedBy = 'seedanceApi';

  icon: Icon = {
    light: 'file:seedance-light.svg',
    dark: 'file:seedance-dark.svg',
  };

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      description:
        'Reusable Volcengine Ark API Key shared by all Seedance task operations in this node',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
    },
  ];
}
