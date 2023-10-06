import { Request, Response } from "express";
import { resolveImageData } from "../image-generators/common/resolveImage";
import { generate } from "../image-generators/vanilla";
import { Resvg } from "@resvg/resvg-js";
import _ from "lodash";
import { Logger } from "../util/logger";

export const imageRoute = async (req: Request, res: Response) => {
  const debug = new Logger(true);
  const src = req.params[0];
  const title = req.query.title;
  const description = req.query.description;
  const urlRoot = req.query.urlRoot;

  debug.log("imageRoute - success", { src });
  if (title !== undefined && !_.isString(title)) {
    return res
      .status(400)
      .send({ status: 400, error: "Invalid title query param" });
  }
  if (description !== undefined && !_.isString(description)) {
    return res.status(400).send({
      status: 400,
      error: "Invalid description query param",
    });
  }
  if (urlRoot !== undefined && !_.isString(urlRoot)) {
    return res
      .status(400)
      .send({ status: 400, error: "Invalid description query param" });
  }

  let width, height: number | undefined;
  try {
    // TODO: cache this so that satori and rasterizer don't refetch
    // TODO: add timeout
    debug.log("  resolveImageData - start", { src });
    const [, tempWidth, tempHeight] = await resolveImageData(src);
    debug.log("  resolveImageData - success", { src });
    if (tempWidth === undefined) throw new Error("Could not recover width");
    if (tempHeight === undefined) throw new Error("Could not recover height");
    width = tempWidth;
    height = tempHeight;
  } catch (err) {
    debug.log("  resolveImageData - error", { src });
    return res
      .status(400)
      .send(
        JSON.stringify({ status: 400, error: "Error fetching source image" }),
      );
  }
  debug.log("  generate - start", { src });
  const svg = await generate(src, {
    width,
    height,
    title,
    description,
    urlRoot,
  });
  debug.log("  generate - success", { src });

  const renderOptions = {
    background: "rgba(0, 0, 0, 0)",
    fitTo: {
      mode: "original" as const,
    },
    font: {
      loadSystemFonts: false,
    },
  };
  debug.log("  asPng - start", { src });
  const png = new Resvg(svg, renderOptions).render().asPng();
  debug.log("  asPng - success", { src });
  debug.log("imageRoute - success", { src });
  return res
    .set("Cache-Control", "public, max-age=259200") // 3 days
    .set("Content-Type", "image/png")
    .send(png);
};
