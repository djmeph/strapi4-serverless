FROM public.ecr.aws/amazonlinux/amazonlinux:2@sha256:0f2e782bf231eb88f4e5fb752fedab96d5254627b18aa68f1ef1c4af6050f502
ARG port=1337
ENV NODE_ENV production
WORKDIR /src

RUN curl -sL https://rpm.nodesource.com/setup_16.x | bash - \
    && yum install -y nodejs \
    && npm i -g yarn \
    && yum clean all \
    && rm -rf /var/cache/yum

COPY package.json yarn.lock ./
RUN yarn --prod --frozen-lockfile && yarn cache clean

COPY public ./public
COPY favicon.ico server.js ./
COPY config ./config
COPY src ./src
RUN yarn build

EXPOSE ${port}
ENV PORT ${port}

CMD ["node", "server"]
