import type { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class SeedanceApi implements ICredentialType {
	name = 'seedanceApi';

	displayName = 'Seedance 凭证 API';

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
			description: '请输入火山方舟 Seedance API Key。当前节点仅需要这一项凭证信息。',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
		},
	];
}
