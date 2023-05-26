export const handler = async function (event: any) {
  console.log("request:", JSON.stringify(event, undefined, 2));
  const id = event.pathParameters?.id || "1";

  const body = {
    message: `Hello ${id}!`,
  };

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
};
