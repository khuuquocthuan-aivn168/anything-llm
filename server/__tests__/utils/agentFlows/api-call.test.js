const executeApiCall = require("../../../utils/agentFlows/executors/api-call");
const { safeJsonParse } = require("../../../utils/http");

describe("executeApiCall", () => {
  let mockContext;
  let originalFetch;

  beforeEach(() => {
    mockContext = {
      introspect: jest.fn(),
      logger: jest.fn(),
    };
    originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('{"success": true}'),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should normalize lowercase method to uppercase and send request with capitalized method", async () => {
    const config = {
      url: "https://api.example.com/test",
      method: "post",
      bodyType: "json",
      body: '{"foo": "bar"}',
    };

    await executeApiCall(config, mockContext);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/test",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it("should stringify and send body when body is already an object", async () => {
    const config = {
      url: "https://api.example.com/test",
      method: "POST",
      bodyType: "json",
      body: { foo: "bar" },
    };

    await executeApiCall(config, mockContext);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/test",
      expect.objectContaining({
        body: JSON.stringify({ foo: "bar" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("should parse, normalize and stringify body when body is a valid JSON string", async () => {
    const config = {
      url: "https://api.example.com/test",
      method: "POST",
      bodyType: "json",
      body: '{"foo":   "bar"}',
    };

    await executeApiCall(config, mockContext);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/test",
      expect.objectContaining({
        body: JSON.stringify({ foo: "bar" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("should fall back to raw body string if body is an invalid JSON string (e.g. template literals or syntax error)", async () => {
    const config = {
      url: "https://api.example.com/test",
      method: "POST",
      bodyType: "json",
      body: '{"invalid": ${some_var_value_not_escaped}}',
    };

    await executeApiCall(config, mockContext);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/test",
      expect.objectContaining({
        body: '{"invalid": ${some_var_value_not_escaped}}',
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("should process form data items correctly", async () => {
    const config = {
      url: "https://api.example.com/test",
      method: "POST",
      bodyType: "form",
      formData: [
        { key: "foo", value: "bar" },
        { key: "num", value: "123" },
      ],
    };

    await executeApiCall(config, mockContext);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/test",
      expect.objectContaining({
        body: "foo=bar&num=123",
        headers: expect.objectContaining({
          "Content-Type": "application/x-www-form-urlencoded",
        }),
      })
    );
  });
});
