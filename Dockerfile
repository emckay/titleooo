FROM oven/bun

WORKDIR /usr/src/app

COPY package*.json bun.lockb ./
RUN bun install
# doesn't work becuase prettier can't read files: https://github.com/oven-sh/bun/issues/1446
# RUN bun check
COPY . .

ENV NODE_ENV production

CMD [ "bun", "start" ]