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
  const title = options.title?.includes(" |")
    ? options.title?.split(" | ").slice(0, -1).join("") || ""
    : options.title;
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
          width: "100%",
          height: "100%",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundImage: `url(${originalSrc})`,
        }}
      />
      {options.title && (
        <div
          style={{
            position: "absolute",
            top: `${rem}px`,
            left: `${rem}px`,
            width: `${25 * rem}px`,
            maxHeight: `${13 * rem}px`,
            overflow: "hidden",
            color: "white",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            borderRadius: `${rem}px`,
          }}
        >
          <div
            style={{
              padding: `${rem}px`,
              borderRadius: `${rem}px`,
              backgroundColor: "rgba(0,0,0, 0.6)",
              fontSize: `${2 * rem}px`,
            }}
          >
            {title}
          </div>
        </div>
      )}
      {options.urlRoot && (
        <div
          style={{
            position: "absolute",
            right: `${rem}px`,
            bottom: `${rem}px`,
            color: "white",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            borderRadius: `${rem}px`,
          }}
        >
          <div
            style={{
              padding: `${0.5 * rem}px`,
              borderRadius: `${0.5 * rem}px`,
              backgroundColor: "rgba(0,0,0, 0.6)",
              fontSize: `${0.825 * rem}px`,
            }}
          >
            {options.urlRoot}
          </div>
        </div>
      )}
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
