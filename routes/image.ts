import { Request, Response } from "express";
import { resolveImageData } from "../image-generators/common/resolveImage";
import { generate } from "../image-generators/vanilla";
import { Resvg } from "@resvg/resvg-js";
import _ from "lodash";

export const imageRoute = async (req: Request, res: Response) => {
  const src = req.params[0];
  const title = req.query.title;
  const description = req.query.description;
  const urlRoot = req.query.urlRoot;

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
    const [, tempWidth, tempHeight] = await resolveImageData(src);
    if (tempWidth === undefined) throw new Error("Could not recover width");
    if (tempHeight === undefined) throw new Error("Could not recover height");
    width = tempWidth;
    height = tempHeight;
  } catch (err) {
    return res
      .status(400)
      .send(
        JSON.stringify({ status: 400, error: "Error fetching source image" }),
      );
  }
  const svg = await generate(src, {
    width,
    height,
    title,
    description,
    urlRoot,
  });

  const renderOptions = {
    background: "rgba(0, 0, 0, 0)",
    fitTo: {
      mode: "original" as const,
    },
    font: {
      loadSystemFonts: false,
    },
  };
  const png = new Resvg(svg, renderOptions).render().asPng();

  return res.set("Content-Type", "image/png").send(png);
};
