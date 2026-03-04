import { v4 as uuidv4 } from 'uuid';

interface LoginResponseBody {
  success: boolean;
  data?: {
    accessToken?: string;
  };
  errorCode?: string;
  errorMessage?: string;
}

export interface HttpPostClientLike {
  post<T>(
    url: string,
    data?: unknown,
    config?: Record<string, unknown>,
  ): Promise<{ data: T }>;
}

export interface LoginManagerOptions {
  axiosInstance: HttpPostClientLike;
  baseUrl: string;
  email: string;
  password: string;
  loginUseLdap: boolean;
  locale: string;
  branchId: number;
  clientVersion: string;
  clientMode: string;
  projectId: number;
  deviceId?: string;
}

export interface LoginManagerLike {
  getAccessToken(forceRefresh?: boolean): Promise<string>;
}

export class LoginManager implements LoginManagerLike {
  private cachedToken: string | null = null;

  private readonly deviceId: string;

  public constructor(private readonly options: LoginManagerOptions) {
    this.deviceId = options.deviceId ?? uuidv4();
  }

  public async getAccessToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh && this.cachedToken) {
      return this.cachedToken;
    }

    const token = await this.login();
    this.cachedToken = token;
    return token;
  }

  private async login(): Promise<string> {
    const loginPath = this.options.loginUseLdap ? '/passport/ldap' : '/api/v1/login';
    const url = `${this.options.baseUrl}${loginPath}`;

    const response = await this.options.axiosInstance.post<LoginResponseBody>(
      url,
      {
        account: this.options.email,
        password: this.options.password,
      },
      {
        params: {
          locale: this.options.locale,
        },
        headers: {
          Accept: 'application/json',
          'Accept-Language': this.options.locale,
          'Content-Type': 'application/json;charset=UTF-8',
          'X-Branch-Id': String(this.options.branchId),
          'X-Client-Mode': this.options.clientMode,
          'X-Client-Version': this.options.clientVersion,
          'X-Device-Id': this.deviceId,
          'X-Project-Id': String(this.options.projectId),
        },
      },
    );

    const data = response.data;

    if (!data.success) {
      throw new Error(
        `Apifox login failed: ${data.errorMessage ?? data.errorCode ?? 'unknown error'}`,
      );
    }

    const accessToken = data.data?.accessToken;

    if (!accessToken || typeof accessToken !== 'string') {
      throw new Error('Apifox login failed: accessToken is missing');
    }

    return accessToken;
  }
}
