import { Request, Response } from "express";
import * as http from "follow-redirects";
import { Logger } from "../util/logger";
import parse from "node-html-parser";

export const urlRoute = async (req: Request, res: Response) => {
  const debug = new Logger(true);
  const paramUrl = req.params[0];
  const url =
    paramUrl.startsWith("http://") || paramUrl.startsWith("https://")
      ? paramUrl
      : `https://${paramUrl}`;
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
  debug.log("  getUrlHeadTag - begin", { url });
  let urlOrigin, headTag: string;
  try {
    const res = await getUrlHeadTag(url);
    urlOrigin = res.urlOrigin;
    headTag = res.headTag;
  } catch (err) {
    debug.log("  getUrlHeadTag - error", { url });
    return res
      .status(400)
      .send(
        JSON.stringify({ status: 400, error: "Error fetching source page." }),
      );
  }
  debug.log("  getFinalBaseUrl - success", { url });

  debug.log("  extractMetaTags - begin", { url });
  const metaTags = extractMetaTags(headTag);
  debug.log("  extractMetaTags - success", { url });

  const urlRoot = new URL(urlOrigin).origin
    .replace("www.", "")
    .replace(/^https?:\/\//, "");

  const twitterDescription = metaTags.findLast(
    (t) =>
      t.name === "twitter:description" || t.property === "twitter:description",
  )?.content;
  const ogDescription = metaTags.findLast(
    (t) => t.name === "og:description" || t.property === "og:description",
  )?.content;
  const twitterTitle = metaTags.findLast(
    (t) => t.name === "twitter:title" || t.property === "twitter:title",
  )?.content;
  const ogTitle = metaTags.findLast(
    (t) => t.name === "og:title" || t.property === "og:title",
  )?.content;

  const twitterImgSrcMetaProperties = ["twitter:image", "twitter:image:src"];
  const ogImgSrcMetaProperties = [
    "og:image",
    "og:image:src",
    "og:image:secure_url",
  ];
  let proxiedMetaTags: MetaTagData[];
  debug.log("  proxying metatags - begin", { url });
  try {
    proxiedMetaTags = metaTags.map((t) => {
      if (!t.content) return t;
      if (
        (t.name && twitterImgSrcMetaProperties.includes(t.name)) ||
        (t.property && twitterImgSrcMetaProperties.includes(t.property))
      ) {
        return {
          ...t,
          content: imgRoute(t.content, {
            title: twitterTitle ?? ogTitle,
            description: twitterDescription ?? ogDescription,
            urlRoot,
          }),
        };
      }
      if (
        (t.name && ogImgSrcMetaProperties.includes(t.name)) ||
        (t.property && ogImgSrcMetaProperties.includes(t.property))
      ) {
        return {
          ...t,
          content: imgRoute(t.content, {
            title: ogTitle,
            description: ogDescription,
            urlRoot,
          }),
        };
      }
      return t;
    });
  } catch (err) {
    debug.log("  proxying metatags - error", {
      url,
      error: (err as Error).message,
    });
    return res
      .status(500)
      .send(
        JSON.stringify({ status: 500, error: "Error proxying image links." }),
      );
  }
  debug.log("  proxying metatags - success", { url });

  const htmlResponse = `<!DOCTYPE html>
<html lang="en">
<head>
	${proxiedMetaTags.map((t) => metaTagToHtml(t)).join("\n  ")}
	<script type="text/javascript">
		window.location.href = "${url}";
	</script>
</head>
<body>
	If you are not redirected automatically, follow this <a href="${url}">link</a>.
</body>
</html>`;

  debug.log("urlRoute - success", { url });
  return res.send(htmlResponse);
};

const getUrlHeadTag = async (
  url: string,
): Promise<{ urlOrigin: string; headTag: string }> => {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https");
    const client = isHttps ? http.https : http.http;

    let isInHead = false;
    let headTag = "";

    client
      .get(url, (response) => {
        response.on("data", (chunk) => {
          const chunkStr = chunk.toString();

          if (!isInHead) {
            const headStartIndex = chunkStr.indexOf("<head>");
            if (headStartIndex !== -1) {
              isInHead = true;
              headTag += chunkStr.slice(headStartIndex);
            }
          } else {
            headTag += chunkStr;
          }

          if (isInHead && headTag.includes("</head>")) {
            response.destroy();
            const urlOrigin = new URL(response.responseUrl).origin;
            const headEndIndex = headTag.indexOf("</head>") + 7; // +7 to include the </head> tag itself
            headTag = headTag.slice(0, headEndIndex);
            resolve({ urlOrigin, headTag });
          }
        });

        response.on("end", () => {
          // this shouldn't happen becuase we should resolve promise when we see </head>
          reject(new Error("Failed to extract head or reach final url"));
        });
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
  let urlObject: URL;
  try {
    urlObject = new URL(url);
  } catch (err) {
    new Logger(true).log("error parsing url", { url });
    return url;
  }
  const sanitizedParams: Record<string, string> = {};
  for (const key in params) {
    sanitizedParams[key] = params[key] === undefined ? "" : `${params[key]!}`;
  }
  const searchParams = new URLSearchParams(sanitizedParams);
  urlObject.search = searchParams.toString();
  return urlObject.toString();
};

const imgRoute = (
  src: string,
  params: { [key: string]: string | undefined },
) => {
  // TODO: encode ? in image urls to prevent double ? in routes
  return appendParamsToUrl(`${process.env.URL_ORIGIN}/img/${src}`, params);
};

type MetaTagData = {
  name?: string;
  property?: string;
  content?: string;
  [key: string]: string | undefined;
};

const extractMetaTags = (headTag: string): MetaTagData[] => {
  const root = parse(headTag);
  const metaTags = root.querySelectorAll("meta");
  return metaTags
    .map((tag) => tag.attributes)
    .filter((data) => Object.keys(data).length > 0);
};

const metaTagToHtml = (data: MetaTagData) => {
  const attributes = Object.entries(data)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ");

  return `<meta ${attributes} />`;
};
