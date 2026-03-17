import axios from "axios"
import MockAdapter from "axios-mock-adapter"
import { describe, expect, it } from "vitest"
import { LoginManager } from "../../src/auth/login.js"

describe("LoginManager", () => {
  const baseUrl = "https://example.apifox.com"
  const email = "user@example.com"
  const password = "secret"
  const locale = "zh-CN"
  const branchId = 0
  const clientVersion = "2.7.2"
  const clientMode = "web"
  const projectId = 345101

  it("首次获取 token 时调用登录接口并缓存", async () => {
    const instance = axios.create()
    const mock = new MockAdapter(instance as unknown as ConstructorParameters<typeof MockAdapter>[0])
    mock.onPost(`${baseUrl}/api/v1/login`).reply(200, { success: true, data: { accessToken: "token-1" } })

    const manager = new LoginManager({
      axiosInstance: instance,
      baseUrl,
      email,
      password,
      loginUseLdap: false,
      locale,
      branchId,
      clientVersion,
      clientMode,
      projectId,
      deviceId: "device-1",
    })

    const token1 = await manager.getAccessToken()
    const token2 = await manager.getAccessToken()

    expect(token1).toBe("token-1")
    expect(token2).toBe("token-1")
    expect(mock.history.post).toHaveLength(1)
    const requestBody = JSON.parse(String(mock.history.post[0]?.data)) as {
      account: string
      password: string
    }
    expect(requestBody.account).toBe(email)
    expect(requestBody.password).toBe(password)
    expect(mock.history.post[0]?.params?.locale).toBe(locale)
    expect(mock.history.post[0]?.headers?.["X-Client-Version"]).toBe(clientVersion)
  })

  it("forceRefresh=true 时重新登录", async () => {
    const instance = axios.create()
    const mock = new MockAdapter(instance as unknown as ConstructorParameters<typeof MockAdapter>[0])

    mock.onPost(`${baseUrl}/api/v1/login`).replyOnce(200, { success: true, data: { accessToken: "token-1" } })
    mock.onPost(`${baseUrl}/api/v1/login`).replyOnce(200, { success: true, data: { accessToken: "token-2" } })

    const manager = new LoginManager({
      axiosInstance: instance,
      baseUrl,
      email,
      password,
      loginUseLdap: false,
      locale,
      branchId,
      clientVersion,
      clientMode,
      projectId,
      deviceId: "device-1",
    })

    const token1 = await manager.getAccessToken()
    const token2 = await manager.getAccessToken(true)

    expect(token1).toBe("token-1")
    expect(token2).toBe("token-2")
    expect(mock.history.post).toHaveLength(2)
  })

  it("登录失败时抛错", async () => {
    const instance = axios.create()
    const mock = new MockAdapter(instance as unknown as ConstructorParameters<typeof MockAdapter>[0])

    mock.onPost(`${baseUrl}/api/v1/login`).reply(200, {
      success: false,
      errorCode: "401001",
      errorMessage: "invalid credentials",
    })

    const manager = new LoginManager({
      axiosInstance: instance,
      baseUrl,
      email,
      password,
      loginUseLdap: false,
      locale,
      branchId,
      clientVersion,
      clientMode,
      projectId,
      deviceId: "device-1",
    })

    await expect(manager.getAccessToken()).rejects.toThrow(/invalid credentials/i)
  })
})
