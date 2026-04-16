import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';

import { createOperationProperties } from './description/create.operation';
import { buildCreatePayload, buildCreateRequestSummary, mapCreateResponse } from './shared/mappers/createPayload';
import { normalizeSeedanceError } from './shared/mappers/errors';
import { getSeedanceOperationEndpoint } from './shared/transport/endpoints';
import { seedanceApiRequest } from './shared/transport/request';
import type { SeedanceCreateInput } from './shared/validators/create';

export class Seedance implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Seedance',
    name: 'seedance',
    icon: 'file:seedance.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
    description: 'Seedance task node that reuses one shared API Key credential across operations',
    defaults: {
      name: 'Seedance',
    },
    usableAsTool: true,
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'seedanceApi',
        displayName: 'Seedance API',
        required: true,
        testedBy: 'seedanceApi',
      },
    ],
		properties: [
			{
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        default: 'task',
        options: [
          {
            name: 'Task',
            value: 'task',
          },
        ],
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        default: 'create',
        options: [
          {
            name: 'Create Task',
            value: 'create',
            description: 'Create a text-to-video Seedance task',
            action: 'Create task a task',
          },
          {
            name: 'Get Task',
            value: 'get',
            description: 'Get a Seedance task by ID',
            action: 'Get task a task',
          },
        ],
        displayOptions: {
          show: {
            resource: ['task'],
          },
				},
			},
			...createOperationProperties,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const operation = this.getNodeParameter('operation', itemIndex) as string;

			try {
				if (operation === 'create') {
					const createInput: SeedanceCreateInput = {
						model: this.getNodeParameter('model', itemIndex) as string,
						prompt: this.getNodeParameter('prompt', itemIndex) as string,
						resolution: this.getNodeParameter('resolution', itemIndex) as string,
						ratio: this.getNodeParameter('ratio', itemIndex) as string,
						seed: this.getNodeParameter('seed', itemIndex) as number,
						watermark: this.getNodeParameter('watermark', itemIndex) as boolean,
						serviceTier: this.getNodeParameter('serviceTier', itemIndex) as string,
						executionExpiresAfter: this.getNodeParameter('executionExpiresAfter', itemIndex) as number,
						returnLastFrame: this.getNodeParameter('returnLastFrame', itemIndex) as boolean,
						generateAudio: this.getNodeParameter('generateAudio', itemIndex) as boolean,
					};

					const durationValue = this.getNodeParameter('duration', itemIndex) as number | '';
					const framesValue = this.getNodeParameter('frames', itemIndex) as number | '';

					if (durationValue !== '') {
						createInput.duration = durationValue;
					}

					if (framesValue !== '') {
						createInput.frames = framesValue;
					}

					const payload = buildCreatePayload(createInput);
					const requestSummary = buildCreateRequestSummary(createInput);
					const response = await seedanceApiRequest(this, {
						method: 'POST',
						path: getSeedanceOperationEndpoint('createTask'),
						body: payload,
					});

					returnData.push({
						json: mapCreateResponse(response as Parameters<typeof mapCreateResponse>[0], requestSummary),
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				if (operation === 'get') {
					returnData.push({
						json: {
							resource: 'task',
							operation,
							credentialType: 'seedanceApi',
							status: 'not_implemented',
							message: 'Phase 1 stub: get task implementation arrives in Task 2 of plan 01-03.',
						},
						pairedItem: { item: itemIndex },
					});
				}
			} catch (error) {
				const normalized = normalizeSeedanceError(error);

				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: normalized,
							status: 'failed',
						},
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				throw error;
			}
		}

		return [returnData];
	}
}
