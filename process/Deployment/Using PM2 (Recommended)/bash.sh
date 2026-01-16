npm install -g pm2
pm2 start server.js --name voice-accounting
pm2 save
pm2 startup