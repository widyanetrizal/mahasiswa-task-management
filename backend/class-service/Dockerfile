FROM node:18

WORKDIR /app

COPY . .

COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

RUN npm config set registry https://registry.npmjs.org/
RUN npm config set fetch-retries 10
RUN npm config set fetch-retry-mintimeout 20000
RUN npm config set fetch-retry-maxtimeout 120000

RUN npm install

EXPOSE 4006

CMD ["/wait-for-it.sh", "mysql:3306", "--", "/wait-for-it.sh", "rabbitmq:5672", "--", "npm", "start"]
# CMD ["/wait-for-it.sh", "mysql:3306", "--", "npm", "start"]
# CMD ["/wait-for-it.sh", "rabbitmq:5672", "--", "npm", "start"]
# CMD ["bash", "-c", "/wait-for-it.sh mysql:3306 -- /wait-for-it.sh rabbitmq:5672 -- npm start"]