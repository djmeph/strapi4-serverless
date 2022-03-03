FROM ubuntu:20.04 as base
WORKDIR /src
ENV DEBIAN_FRONTEND="noninteractive"

COPY rc/.bashrc rc/.profile rc/.git-completion /root/

RUN apt-get update && apt-get install -y apt-transport-https ca-certificates curl software-properties-common build-essential vim nano git unzip zip
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs
RUN npm i -g yarn
RUN yarn global add aws-cdk

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
  && unzip awscliv2.zip \
  && ./aws/install

RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add - \
  && add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable" \
  && apt-cache policy docker-ce \
  && apt-get install -y docker-ce
