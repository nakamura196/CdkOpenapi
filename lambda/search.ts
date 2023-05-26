const { Client } = require("@opensearch-project/opensearch");
const { fromEnv } = require("@aws-sdk/credential-providers");

export const handler = async function (event: any) {
  // console.log("request:", JSON.stringify(event, undefined, 2));

  // const name = event.queryStringParameters?.name || "World";

  const keyword = event.queryStringParameters?.keyword || "";

  try {
    const client = new Client({
      node: process.env.ELASTIC_HOST,
      auth: {
        username: process.env.ELASTIC_USERNAME,
        password: process.env.ELASTIC_PASSWORD,
      },
      credentials: fromEnv(),
      /*,
        tls: {
            ca: fs.readFileSync(path.join(__dirname, process.env.ELASTIC_CERT_NAME)),
            rejectUnauthorized: false
        }
        */
    });

    const body: any = {};

    if (keyword !== "") {
      body["query"] = {
        match_phrase: {
          label: {
            query: keyword,
          },
        },
      };
    }

    const result = await client.search({
      index: process.env.ELASTIC_INDEX_NAME,
      body,
    });

    const converted = {
      total: result.body.hits.total.value,
      hits: result.body.hits.hits.map((hit: any) => {
        const source = hit._source;
        source._id = hit._id;
        return source;
      }),
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(converted),
    };
  } catch (error: any) {
    console.log("error:", error);
    // error.env = process.env;
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(error),
    };
  }

  /*
    const body_ = {
      message: `Hello ${name}!`,
    }
    */

  /*
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(result),
  };
  */
};
