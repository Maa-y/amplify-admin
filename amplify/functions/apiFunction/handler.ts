import type { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("event", event);
  
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*", // Restrict this to specific domains in production
      "Access-Control-Allow-Headers": "*", // Specify only the headers you need in production
    },
    body: JSON.stringify({
      message: "Hello from Amplify API Gateway and Lambda!",
      timestamp: new Date().toISOString(),
      path: event.path,
      method: event.httpMethod,
      queryParams: event.queryStringParameters,
    }),
  };
};
