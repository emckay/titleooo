import satori from "satori";
import fs from "fs";
import { ASPECT_RATIO } from "../common/aspectRatio";

const font = fs.readFileSync("assets/fonts/Roboto-Regular.ttf");
const fontBold = fs.readFileSync("assets/fonts/Roboto-Bold.ttf");

export const generate = (
  originalSrc: string,
  options: {
    width: number;
    height: number;
    title?: string;
    description?: string;
    urlRoot?: string;
  },
) => {
  let width = options.width;
  let height = options.height;
  const startingRatio = options.width / options.height;
  if (startingRatio > ASPECT_RATIO) {
    width = Math.round(options.height * ASPECT_RATIO);
  } else if (startingRatio < ASPECT_RATIO) {
    height = Math.round(options.width / ASPECT_RATIO);
  }
  const rem = Math.round(height * 0.0597); // 16px at twitter's full height of 268px
  const borderColor = "rgb(207, 217, 222)";
  const urlColor = "rgb(170, 184, 194)";
  const titleFontSize = Math.ceil(rem);
  const descriptionFontSize = Math.ceil(rem);
  const urlRootFontSize = Math.ceil(rem);
  const borderRadius = 0;
  const gap = Math.ceil(options.height * 0.03125);
  // const captionMarginTop = Math.ceil(fourPx * 2)
  const captionMarginTop = 0;
  const horizontalPadding = Math.ceil(rem * 0.75);
  const verticalPadding = Math.ceil(rem * 0.5);
  const captionHeight = Math.ceil(
    (options.title ? titleFontSize * 1.1 : 0) +
      (options.description ? descriptionFontSize * 1.1 : 0) +
      (options.title && options.description ? gap : 0) +
      verticalPadding * 2,
  );
  const image = satori(
    <div
      style={{
        display: "flex",
        position: "relative",
        height: "100%",
        width: "100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          borderRadius: `${borderRadius}px`,
          height: `${height - captionHeight - captionMarginTop}px`,
          width: "100%",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundImage: `url(${originalSrc})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          // height: captionHeight,
          backgroundColor: "#FFF",
          borderRadius: `${borderRadius}px`,
          borderTop: `1px solid ${borderColor}`,
          display: "flex",
          flexDirection: "column",
          gap: `${gap}px`,
          paddingTop: `${verticalPadding}px`,
          paddingBottom: `${verticalPadding}px`,
          paddingLeft: `${horizontalPadding}px`,
          paddingRight: `${horizontalPadding}px`,
        }}
      >
        {options.title && (
          <div
            style={{
              fontSize: `${titleFontSize}px`,
              fontWeight: "bold",
              fontFamily: "Roboto",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {options.title}
          </div>
        )}
        {options.description && (
          <div
            style={{
              fontSize: `${descriptionFontSize}px`,
              fontFamily: "Roboto",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {options.description}
          </div>
        )}
        {options.urlRoot && (
          <div
            style={{
              fontSize: `${urlRootFontSize}px`,
              fontFamily: "Roboto",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: urlColor,
            }}
          >
            {options.urlRoot}
          </div>
        )}
      </div>
    </div>,
    {
      width: width,
      height: height,
      fonts: [
        {
          name: "Roboto",
          data: font,
          weight: 400,
          style: "normal",
        },
        {
          name: "Roboto",
          data: fontBold,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
  return image;
};
