import satori from "satori";
import fs from "fs";
import path from "path";

const font = fs.readFileSync(
  path.join(__dirname, "../../assets/fonts/Roboto-Regular.ttf"),
);
const fontBold = fs.readFileSync(
  path.join(__dirname, "../../assets/fonts/Roboto-Bold.ttf"),
);

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
  const fourPx = options.width * 0.0078125;
  const borderColor = "rgb(207, 217, 222)";
  const urlColor = "rgb(170, 184, 194)";
  const titleFontSize = Math.ceil(fourPx * 4);
  const descriptionFontSize = Math.ceil(fourPx * 4);
  const urlRootFontSize = Math.ceil(fourPx * 4);
  // const borderRadius = Math.ceil(fourPx * 4)
  const borderRadius = 0;
  const gap = Math.ceil(options.height * 0.03125);
  // const captionMarginTop = Math.ceil(fourPx * 2)
  const captionMarginTop = 0;
  const horizontalPadding = Math.ceil(fourPx * 3);
  const verticalPadding = Math.ceil(fourPx * 2);
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
          height: `${options.height - captionHeight - captionMarginTop}px`,
          width: "100%",
          backgroundSize: "cover",
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
      width: options.width,
      height: options.height,
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
