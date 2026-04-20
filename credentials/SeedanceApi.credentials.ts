import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class SeedanceApi implements ICredentialType {
	name = 'seedanceApi';

	displayName = 'Seedance 凭证 API';

	documentationUrl = 'https://www.volcengine.com/docs/82379/1298459';

	icon: Icon = {
		light: 'file:seedance-light.png',
		dark: 'file:seedance-dark.png',
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

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://ark.cn-beijing.volces.com',
			url: '/api/v3/contents/generations/tasks',
			method: 'GET',
			qs: {
				page_num: 1,
				page_size: 1,
			},
		},
	};
}
