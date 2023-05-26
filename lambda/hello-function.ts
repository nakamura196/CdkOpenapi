export const handler = async function (event: any) {
    console.log("request:",JSON.stringify(event, undefined,2))
    const name = event.queryStringParameters?.name || 'World';

    const body = {
      message: `Hello ${name}!`,
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    };
  }