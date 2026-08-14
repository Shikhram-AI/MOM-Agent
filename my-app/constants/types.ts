export type MoMStatus = 'completed' | 'processing' | 'failed';

export interface MoMItem {
    id: string;
    title: string;
    date: string;
    duration: string;
    status: MoMStatus;
    summaryPreview?: string;
    actionItemsCount?: number;
}