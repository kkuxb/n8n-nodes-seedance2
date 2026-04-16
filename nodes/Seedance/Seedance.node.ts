import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';

export class Seedance implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Seedance',
    name: 'seedance',
    icon: 'file:seedance.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
    description: 'Create or get a Seedance video generation task',
    defaults: {
      name: 'Seedance',
    },
    usableAsTool: true,
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'seedanceApi',
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
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const operation = this.getNodeParameter('operation', 0) as string;

    return [
      this.helpers.returnJsonArray([
        {
          resource: 'task',
          operation,
          status: 'not_implemented',
          message:
            operation === 'create'
              ? 'Phase 1 stub: create task implementation arrives in a later plan.'
              : 'Phase 1 stub: get task implementation arrives in a later plan.',
        },
      ]),
    ];
  }
}
