FROM node:lts-alpine

ENV NODE_ENV=development

WORKDIR /usr/src/app

COPY ["package.json", "package-lock.json*", "./"]

# แก้ตรงนี้: เพิ่มการลง nodemon เข้าไป
RUN npm install -g nodemon && npm install

COPY . .

RUN chown -R node /usr/src/app
USER node

EXPOSE 3000

CMD ["npm", "run", "dev"]