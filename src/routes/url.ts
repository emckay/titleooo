import { Request, Response } from "express";
import * as http from "follow-redirects";
import { DebugLogger } from "../util/debug-logger";
import {JSDOM} from 'jsdom'

export const urlRoute = async (req: Request, res: Response) => {
  const debug = new DebugLogger();
  const url = req.params[0];
  debug.log("urlRoute - begin", { url });
  if (
    !/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi.test(
      url
    )
  ) {
    return res
      .status(400)
      .send(JSON.stringify({ status: 400, error: "No URL detected" }));
  }
  debug.log("  getFinalBaseUrl - begin", { url });
  const { urlOrigin, html } = await getRedirectedPage(url);
  debug.log("  getFinalBaseUrl - success", { url });

  debug.log("  extractMetaTags - begin", { url });
  const metaTags = extractMetaTags(html);
  debug.log("  extractMetaTags - success", { url });

  const urlRoot = new URL(urlOrigin).origin
    .replace("www.", "")
    .replace(/^https?:\/\//, "");

  const twitterDescription = metaTags.findLast(
    (t) =>
      t.name === "twitter:description" || t.property === "twitter:description"
  )?.content;
  const ogDescription = metaTags.findLast(
    (t) => t.name === "og:description" || t.property === "og:description"
  )?.content;
  const twitterTitle = metaTags.findLast(
    (t) => t.name === "twitter:title" || t.property === "twitter:title"
  )?.content;
  const ogTitle = metaTags.findLast(
    (t) => t.name === "og:title" || t.property === "og:title"
  )?.content;

  const proxiedMetaTags = metaTags.map((t) => {
    if (!t.content) return t;
    if (t.name === "twitter:image" || t.property === "twitter:image") {
      return {
        ...t,
        content: imgRoute(t.content, {
          title: twitterTitle ?? ogTitle,
          description: twitterDescription ?? ogDescription,
          urlRoot,
        }),
      };
    }
    if (t.name === "og:image" || t.property === "og:image") {
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

  // regenerate original meta tags
  const htmlResponse = `<!DOCTYPE html>
<html lang="en">
<head>
	${proxiedMetaTags.map((t) => metaTagToHtml(t)).join("\n  ")}
	<script type="text/javascript">
		// window.location.href = "${url}";
	</script>
</head>
<body>
	If you are not redirected automatically, follow this <a href="${url}">link</a>.
</body>
</html>`;

  debug.log("urlRoute - success", { url });
  // Send HTML response
  return res.send(htmlResponse);
};

const getRedirectedPage = async (
  url: string
): Promise<{ urlOrigin: string; html: string }> => {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https");
    const client = isHttps ? http.https : http.http;
    client
      .get(url, (response) => {
        let html = "";
        response.on("data", (chunk) => {
          html += chunk;
        });
        response.on("end", () => {
          if (response.responseUrl) {
            const urlOrigin = new URL(response.responseUrl).origin;
            resolve({ urlOrigin, html });
          } else {
            reject(new Error("Failed to obtain the final URL"));
          }
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

const appendParamsToUrl = (
  url: string,
  params: Record<string, string | number | boolean | undefined>
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

const imgRoute = (
  src: string,
  params: { [key: string]: string | undefined }
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

const extractMetaTags = (htmlString: string): MetaTagData[] => {
	const dom = new JSDOM(htmlString);
	const document = dom.window.document;
	const metaTags = document.querySelectorAll('meta');

  return Array.from(metaTags)
    .map((tag) => {
      const data: MetaTagData = {};

      Array.from(tag.attributes).forEach((attr) => {
        data[attr.name] = attr.value;
      });

      return data;
    })
    .filter((data) => Object.keys(data).length > 0);
};

const metaTagToHtml = (data: MetaTagData) => {
  const attributes = Object.entries(data)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ");

  return `<meta ${attributes} />`;
};
