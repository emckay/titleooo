import { Request, Response } from "express";

export const homeRoute = (req: Request, res: Response) => {
  res.send(
    `<html><body>
		<img src="${process.env.URL_ORIGIN}/img/https://media.cnn.com/api/v1/images/stellar/prod/231006122105-01-trump-court-1003.jpg?title=Trump%27s+anti-immigrant+comments+draw+rebuke+%7C+CNN+Politics&description=Former+President+Donald+Trump+said+in+a+recent+interview+that+undocumented+immigrants+were+%E2%80%9Cpoisoning+the+blood+of+our+country%2C%E2%80%9D+using+language+that+is+often+employed+by+White+supremacists+and+nativists+in+comments+that+have+drawn+rebuke+from+one+prominent+civil+rights+group.&urlRoot=cnn.com" width="512" height="268" />
		<br />
		<br />
		<br />
		<img src="${process.env.URL_ORIGIN}/img/https://ichef.bbci.co.uk/news/1024/branded_news/AE1D/production/_131337544_borderfence.jpg?title=Biden+approves+new+section+of+border+wall+as+Mexico+crossings+rise&description=The+White+House+says+it+has+no+choice+but+to+use+funds+already+appropriated+for+a+border+barrier.&urlRoot=bbc.com" width="512" height="268" />
		</body>`,
  );
};
