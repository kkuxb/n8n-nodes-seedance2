import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';

export class Seedance implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Seedance',
    name: 'seedance',
    icon: 'file:seedance.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Seedance video generation task stub for n8n',
    defaults: {
      name: 'Seedance',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'seedanceApi',
        required: true,
      },
    ],
    properties: [
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
          },
          {
            name: 'Get Task',
            value: 'get',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    return [this.helpers.returnJsonArray([{ status: 'not_implemented' }])];
  }
}
