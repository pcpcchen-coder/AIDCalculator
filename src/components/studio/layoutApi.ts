/**
 * layouts tRPC 存取層。
 *
 * 後端 layoutRouter 已實作（api/routers/dcgen.ts 的 list/get/save/delete），
 * 但目前尚未掛載到 appRouter（api/router.ts 屬後端組範圍，本組不可修改）。
 * 這裡以結構型別轉型補上 `trpc.layouts.*` 的型別；後端掛載後介面完全一致，
 * 運行期若後端未掛載或出錯，錯誤訊息會經由 toast 呈現。
 */
import { trpc } from '@/providers/trpc';

export interface LayoutListRow {
  id: number;
  name: string;
  designId: number | null;
  configName: string | null;
  criterion: string | null;
  updatedAt: string | Date;
}

export interface LayoutRow extends LayoutListRow {
  layout: string;
  createdAt: string | Date;
}

export interface SaveLayoutInput {
  id?: number;
  name: string;
  designId?: number | null;
  configName?: string | null;
  criterion?: string | null;
  layout: string;
}

interface QueryHook<TIn, TOut> {
  useQuery: (
    input: TIn,
    opts?: { enabled?: boolean },
  ) => {
    data: TOut | undefined;
    isLoading: boolean;
    error: { message: string } | null;
    refetch: () => Promise<unknown>;
  };
}

interface MutationHook<TIn, TOut> {
  useMutation: (opts?: {
    onSuccess?: (data: TOut) => void;
    onError?: (err: { message: string }) => void;
  }) => {
    mutate: (input: TIn) => void;
    mutateAsync: (input: TIn) => Promise<TOut>;
    isPending: boolean;
  };
}

interface LayoutsApi {
  list: QueryHook<void, LayoutListRow[]>;
  get: QueryHook<{ id: number }, LayoutRow>;
  save: MutationHook<SaveLayoutInput, { id: number }>;
  delete: MutationHook<{ id: number }, { ok: boolean }>;
}

export const layoutsApi = (trpc as unknown as { layouts: LayoutsApi }).layouts;

interface LayoutsUtils {
  layouts: {
    get: { fetch: (input: { id: number }) => Promise<LayoutRow> };
    list: { invalidate: () => Promise<unknown> };
  };
}

/** utils.layouts.get.fetch / utils.layouts.list.invalidate（同上的過渡型別轉型） */
export function useLayoutsUtils(): LayoutsUtils {
  return trpc.useUtils() as unknown as LayoutsUtils;
}
