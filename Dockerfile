FROM node:12
EXPOSE 8080
ENV PORT 8080
ENV NODE_ENV production

# install deps
COPY ./package.json ./yarn.lock ./
RUN NODE_ENV=development yarn

# copy source and resource then build
COPY ./ ./
RUN yarn build

# set entry bin and command
ENTRYPOINT ["yarn"]
CMD ["start"]
