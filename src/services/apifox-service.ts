import { normalizeApiDetail } from '../mappers/normalize-api-detail.js';
import {
  prepareApiPayloadForWrite,
  serializeApiPayloadForForm,
} from '../serializers/apifox-form-serializer.js';
import type {
  ApifoxApiDetailRaw,
  ApifoxApiFullInput,
  ApifoxClient,
  NormalizedApiDetail,
  SerializedFormPayload,
} from '../types/apifox.js';

export interface GetApiByPathInput {
  path: string;
  method?: string;
  strict?: boolean;
}

export interface GetApiByPathOutput {
  api: NormalizedApiDetail | null;
  conflicts: NormalizedApiDetail[];
}

export interface CreateApiInput {
  payload: ApifoxApiFullInput;
  dryRun?: boolean;
  confirm?: boolean;
}

export interface CreateApiOutput {
  executed: boolean;
  createdId: number | null;
  api: NormalizedApiDetail | null;
  requestPreview: {
    path: string;
    method: string;
    serialized: SerializedFormPayload;
  };
}

export interface UpdateApiInput {
  apiId: number;
  payload: ApifoxApiFullInput;
  dryRun?: boolean;
  confirm?: boolean;
}

export interface UpdateApiOutput {
  executed: boolean;
  api: NormalizedApiDetail | null;
  diff: {
    changedKeys: string[];
  };
  requestPreview: {
    path: string;
    method: string;
    serialized: SerializedFormPayload;
  };
}

export interface ApiByIdDetailOutput {
  api: NormalizedApiDetail;
  raw: ApifoxApiDetailRaw;
}

const normalizePathForLooseMatch = (path: string): string => {
  if (path === '/') {
    return path;
  }

  return path.replace(/\/+$/, '');
};

const shouldExecuteWrite = (
  dryRun: boolean | undefined,
  confirm: boolean | undefined,
): boolean => {
  if (dryRun !== false) {
    return false;
  }

  return confirm === true;
};

const jsonStableStringify = (value: unknown): string => JSON.stringify(value);

const topLevelDiffKeys = (
  previousPayload: Record<string, unknown>,
  nextPayload: Record<string, unknown>,
): string[] => {
  const keySet = new Set<string>([
    ...Object.keys(previousPayload),
    ...Object.keys(nextPayload),
  ]);

  const changed: string[] = [];

  for (const key of keySet) {
    if (
      jsonStableStringify(previousPayload[key]) !==
      jsonStableStringify(nextPayload[key])
    ) {
      changed.push(key);
    }
  }

  return changed.sort();
};

export class ApifoxService {
  public constructor(private readonly client: ApifoxClient) {}

  public async getApiById(apiId: number): Promise<NormalizedApiDetail> {
    const detail = await this.getApiByIdDetail(apiId);
    return detail.api;
  }

  public async getApiByIdDetail(apiId: number): Promise<ApiByIdDetailOutput> {
    const raw = await this.client.getApiById(apiId);
    return {
      raw,
      api: normalizeApiDetail(raw),
    };
  }

  public async getApiByPath(input: GetApiByPathInput): Promise<GetApiByPathOutput> {
    const strict = input.strict ?? true;
    const list = await this.client.listApiDetails();
    const targetMethod =
      typeof input.method === 'string' && input.method.trim().length > 0
        ? input.method.trim().toUpperCase()
        : null;
    if (strict && targetMethod === null) {
      throw new Error('method is required when strict=true');
    }
    const targetPath = strict
      ? input.path
      : normalizePathForLooseMatch(input.path);

    const matched = list.filter((item) => {
      const pathValue = strict
        ? String(item.path)
        : normalizePathForLooseMatch(String(item.path));
      if (pathValue !== targetPath) {
        return false;
      }

      if (targetMethod === null) {
        return true;
      }

      return String(item.method).toUpperCase() === targetMethod;
    });

    if (matched.length === 0) {
      return {
        api: null,
        conflicts: [],
      };
    }

    if (matched.length > 1) {
      return {
        api: null,
        conflicts: matched.map(normalizeApiDetail),
      };
    }

    const matchedApi = matched[0];
    if (!matchedApi) {
      throw new Error('Matched API is undefined');
    }

    return {
      api: normalizeApiDetail(matchedApi),
      conflicts: [],
    };
  }

  public async createApi(input: CreateApiInput): Promise<CreateApiOutput> {
    const preparedPayload = prepareApiPayloadForWrite(input.payload, {
      mode: 'create',
    });
    const serialized = serializeApiPayloadForForm(preparedPayload);
    const shouldExecute = shouldExecuteWrite(input.dryRun, input.confirm);

    if (!shouldExecute) {
      return {
        executed: false,
        createdId: null,
        api: null,
        requestPreview: {
          path: preparedPayload.path,
          method: preparedPayload.method,
          serialized,
        },
      };
    }

    const created = await this.client.createApi(preparedPayload);

    return {
      executed: true,
      createdId: created.id,
      api: normalizeApiDetail(created),
      requestPreview: {
        path: preparedPayload.path,
        method: preparedPayload.method,
        serialized,
      },
    };
  }

  public async updateApi(input: UpdateApiInput): Promise<UpdateApiOutput> {
    const before = await this.client.getApiById(input.apiId);
    const preparedPayload = prepareApiPayloadForWrite(input.payload, {
      mode: 'update',
      apiId: input.apiId,
    });
    const serialized = serializeApiPayloadForForm(preparedPayload);
    const shouldExecute = shouldExecuteWrite(input.dryRun, input.confirm);

    const diffKeys = topLevelDiffKeys(
      before as Record<string, unknown>,
      input.payload as Record<string, unknown>,
    );

    if (!shouldExecute) {
      return {
        executed: false,
        api: null,
        diff: {
          changedKeys: diffKeys,
        },
        requestPreview: {
          path: preparedPayload.path,
          method: preparedPayload.method,
          serialized,
        },
      };
    }

    const updated = await this.client.updateApi(input.apiId, preparedPayload);
    const effectiveUpdated = updated ?? (await this.client.getApiById(input.apiId));

    return {
      executed: true,
      api: normalizeApiDetail(effectiveUpdated),
      diff: {
        changedKeys: diffKeys,
      },
      requestPreview: {
        path: preparedPayload.path,
        method: preparedPayload.method,
        serialized,
      },
    };
  }
}
