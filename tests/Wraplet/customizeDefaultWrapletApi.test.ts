import { customizeDefaultWrapletApi } from "../../src/Wraplet/customizeDefaultWrapletApi";
import { RichWrapletApi } from "../../src/Wraplet/types/RichWrapletApi";

describe("customizeDefaultWrapletApi", () => {
  it("should throw an error if destroy is provided without status", () => {
    const mockApi = {} as RichWrapletApi<any>;
    const args = {
      destroy: jest.fn(),
    };

    expect(() => customizeDefaultWrapletApi(args, mockApi)).toThrow(
      "Cannot customize lifecycle callbacks without providing status. This is because all callbacks have to share the same status.",
    );
  });

  it("should throw an error if initialize is provided without status", () => {
    const mockApi = {} as RichWrapletApi<any>;
    const args = {
      initialize: jest.fn(),
    };

    expect(() => customizeDefaultWrapletApi(args, mockApi)).toThrow(
      "Cannot customize lifecycle callbacks without providing status. This is because all callbacks have to share the same status.",
    );
  });

  it("should successfully customize the API when status is provided", () => {
    const mockApi = {
      original: true,
    } as any;
    const args = {
      status: {} as any,
      destroy: jest.fn(),
    };

    const result = customizeDefaultWrapletApi(args, mockApi);

    expect(result).toBe(mockApi);
    expect(result.destroy).toBe(args.destroy);
    expect(result.status).toBe(args.status);
    expect(result.original).toBe(true);
  });

  it("should successfully customize the API when neither destroy nor initialize are provided", () => {
    const mockApi = {
      original: true,
    } as any;
    const args = {
      someOtherProp: "value",
    } as any;

    const result = customizeDefaultWrapletApi(args, mockApi);

    expect(result).toBe(mockApi);
    expect(result.someOtherProp).toBe("value");
    expect(result.original).toBe(true);
  });
});
