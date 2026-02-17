import { IApiResponse } from "./interfaces/IApiResponse";

export const fetchTyped = async <T>(url: string, method: string = "GET"): Promise<IApiResponse<T> | string> => {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": getEnvOrThrow("RAPID_API_KEY"),
      },
    });

    return response.json() as Promise<IApiResponse<T>>;
  } catch (error) {
    return (error as Error).message;
  }
};

export const getEnvOrThrow = (variableName: string): string => {
  const envVariable = process.env[variableName];
  if (!envVariable) {
    throw new Error(`${variableName} is not defined`);
  }
  return envVariable;
};
