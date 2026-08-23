# ✚【全新檔案，原本缺少/容器化】把 backend 打包成 Docker image 的「食譜」，由上往下逐層執行
FROM node:24-alpine3.22
# 容器內的工作目錄，之後的 COPY / RUN / CMD 都以這裡為基準
WORKDIR /app

# 先只複製 package*.json 再 npm ci —— 這是 Docker 的「快取分層」技巧：
# 只要套件清單沒變，重 build 時這兩層直接用快取，不用每次重裝套件
COPY package*.json ./
# npm ci：嚴格依照 lock 檔安裝（比 npm install 可重現）；--omit=dev 不裝 nodemon 等開發用套件
RUN npm ci --omit=dev

# 再複製其餘程式碼（node_modules 與 .env 已被 .dockerignore 排除，不會進來）
COPY . .

EXPOSE 8080
# ⚠️ 入口檔是 bin/www.js（跟 package.json 的 npm start 一致），不是 app.js——
# app.js 只定義 app、不會啟動伺服器，CMD 指錯檔案容器會「跑完就退出」
CMD ["node", "bin/www.js"]
