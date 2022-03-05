FROM public.ecr.aws/amazonlinux/amazonlinux:2@sha256:0f2e782bf231eb88f4e5fb752fedab96d5254627b18aa68f1ef1c4af6050f502
ARG strapiUrl
ARG publicAdminUrl
ENV NODE_ENV production
ENV STRAPI_URL ${strapiUrl}
ENV STRAPI_ADMIN_URL ${publicAdminUrl}
WORKDIR /src
RUN curl -sL https://rpm.nodesource.com/setup_16.x | bash - \
    && yum install -y nodejs \
    && npm i -g yarn
COPY package.json yarn.lock ./
RUN yarn --prod --frozen-lockfile
RUN yarn cache clean
COPY favicon.ico server.js ./
COPY config ./config
COPY public ./public
COPY src ./src
RUN yarn build
CMD ["node", "server"]
