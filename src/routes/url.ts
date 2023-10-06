import { Request, Response } from "express";
import ogScrape from "open-graph-scraper";
import * as http from "follow-redirects";
import { OgObject } from "open-graph-scraper/dist/lib/types";
import { DebugLogger } from "../util/debug-logger";

export const urlRoute = async (req: Request, res: Response) => {
  const debug = new DebugLogger();
  const url = req.params[0];
  debug.log("urlRoute - begin", { url });
  if (
    !/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi.test(
      url,
    )
  ) {
    return res
      .status(400)
      .send(JSON.stringify({ status: 400, error: "No URL detected" }));
  }
  debug.log("  getFinalBaseUrl - begin", { url });
  const finalUrl = await getFinalBaseUrl(url);
  debug.log("  getFinalBaseUrl - success", { url });
  // TODO: add timeout
  // TODO: cache this so it doesn't get fetched twice
  debug.log("  ogScrape - begin", { url });
  const { error, result } = await ogScrape({ url: finalUrl });
  debug.log("  ogScrape - success", { url });

  if (error) {
    return res.status(400).send(
      JSON.stringify({
        status: 400,
        error: "Error retrieving og from source url",
      }),
    );
  }

  const metasToUpdate = {
    twitterImage: result.twitterImage,
    ogImage: result.ogImage,
  };
  const urlRoot = new URL(finalUrl).origin
    .replace("www.", "")
    .replace(/^https?:\/\//, "");

  // TODO: encode ? in image urls to prevent double ? in routes
  metasToUpdate.twitterImage = metasToUpdate.twitterImage?.map((img) => ({
    ...img,
    url: appendParamsToUrl(`${process.env.URL_ORIGIN}/img/${img.url}`, {
      title: result.twitterTitle || result.ogTitle,
      description: result.twitterDescription || result.ogDescription,
      urlRoot,
    }),
  }));
  metasToUpdate.ogImage = metasToUpdate.ogImage?.map((img) => ({
    ...img,
    url: appendParamsToUrl(`${process.env.URL_ORIGIN}/img/${img.url}`, {
      title: result.ogTitle,
      description: result.ogDescription,
      urlRoot,
    }),
  }));

  // regenerate original meta tags
  const metaTags = Object.entries(result)
    .map(([key, value]) => {
      if (key in metasToUpdate) {
        return generateMetaTags(
          key,
          metasToUpdate[key as keyof typeof metasToUpdate],
        );
      }
      return generateMetaTags(key, value);
    })
    .filter((tag) => tag)
    .join("\n");

  const htmlResponse = `<!DOCTYPE html>
<html lang="en">
<head>
	${metaTags}
	<script type="text/javascript">
		// window.location.href = "${finalUrl}";
	</script>
</head>
<body>
	If you are not redirected automatically, follow this <a href="${finalUrl}">link</a>.
</body>
</html>`;

  debug.log("urlRoute - success", { url });
  // Send HTML response
  return res.send(htmlResponse);
};
const toColonCase = (str: string) => {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1:$2").toLowerCase();
};

const generateMetaTags = (key: string, value: OgObject[keyof OgObject]) => {
  const formattedKey = toColonCase(key);
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "object") {
          return `<meta property="${formattedKey}" name="${formattedKey}" content="${item.url}">`;
        }
        return `<meta property="${formattedKey}" name="${formattedKey}" content="${item}">`;
      })
      .join("\n");
  } else if (typeof value === "object") {
    if ("url" in value || "content" in value) {
      return `<meta property="${formattedKey}" name="${formattedKey}" content="${
        value.url || value.content
      }">`;
    }
    return "";
  } else if (value) {
    return `<meta property="${formattedKey}" name="${formattedKey}" content="${value}">`;
  }
  return "";
};

const getFinalBaseUrl = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https");
    const client = isHttps ? http.https : http.http;

    client
      .get(url, (response) => {
        if (response.responseUrl) {
          resolve(response.responseUrl);
        } else {
          reject(new Error("Failed to obtain the final URL"));
        }
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

const appendParamsToUrl = (
  url: string,
  params: Record<string, string | number | boolean | undefined>,
): string => {
  const urlObject = new URL(url);
  const sanitizedParams: Record<string, string> = {};
  for (const key in params) {
    sanitizedParams[key] = params[key] === undefined ? "" : `${params[key]!}`;
  }
  const searchParams = new URLSearchParams(sanitizedParams);
  urlObject.search = searchParams.toString();
  return urlObject.toString();
};
