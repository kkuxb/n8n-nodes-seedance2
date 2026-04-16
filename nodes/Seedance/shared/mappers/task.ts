import type { IDataObject } from 'n8n-workflow';

import { SEEDANCE_TERMINAL_TASK_STATUSES } from '../constants';

export interface SeedanceTaskError extends IDataObject {
	code?: string;
	message?: string;
}

export interface SeedanceTaskResponse {
	id?: string;
	model?: string;
	status?: string;
	error?: SeedanceTaskError | null;
	created_at?: number;
	updated_at?: number;
	content?: {
		video_url?: string;
		last_frame_url?: string;
	};
	seed?: number;
	resolution?: string;
	ratio?: string;
	duration?: number;
	frames?: number;
	framespersecond?: number;
	generate_audio?: boolean;
	service_tier?: string;
	execution_expires_after?: number;
	usage?: IDataObject;
	[key: string]: IDataObject | string | number | boolean | null | undefined | Array<IDataObject | string | number | boolean> | { video_url?: string; last_frame_url?: string };
}

export function mapTaskResponse(response: SeedanceTaskResponse): IDataObject {
	const status = typeof response.status === 'string' ? response.status : 'unknown';
	const isTerminal = SEEDANCE_TERMINAL_TASK_STATUSES.includes(status as never);
	const isSuccess = status === 'succeeded';
	const isFailure = status === 'failed' || status === 'cancelled' || status === 'expired';
	const shouldPoll = status === 'queued' || status === 'running';

	return {
		taskId: response.id,
		model: response.model,
		status,
		createdAt: response.created_at,
		updatedAt: response.updated_at,
		videoUrl: response.content?.video_url,
		lastFrameUrl: response.content?.last_frame_url,
		usage: response.usage,
		error: response.error
			? {
					code: response.error.code,
					message: response.error.message,
				}
			: null,
		isTerminal,
		isSuccess,
		isFailure,
		shouldPoll,
		retention: {
			taskHistoryDays: 7,
			assetUrlHours: 24,
			message: 'Seedance 仅支持查询最近 7 天任务，videoUrl/lastFrameUrl 默认 24 小时有效，请及时转存。',
		},
		raw: response,
	};
}
