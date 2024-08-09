const express = require('express');
const app = express();
const path = require('node:path');
const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://localhost:27017');
const multer = require('multer');
const fs = require('node:fs/promises');



app.set('view engine', 'ejs');
// publicディレクトリ以下のファイルを静的ファイルとして配信
app.use('/static', express.static(path.join(__dirname, 'public')));


const logMiddleware = (req, res, next) => {
    console.log(req.method, req.path);
    next();
  }
  

  

app.get('/user/:id',logMiddleware, (req, res) => {
    // :idをreq.params.idとして受け取る
    res.status(200).send(req.params.id);
  });



async function main(){
  await client.connect();

  const db = client.db('my-app');

  // ルーティングとミドルウェア
app.get(
  '/',
  // 追加したミドルウェア
  logMiddleware,
  // 元のミドルウェア
  async (req, res) => {
      const users = await db.collection('user').find().toArray();
      const names = users.map((user) => {
        return user.name;
      })

      res.render(path.resolve(__dirname, 'views/index.ejs'), {users : names});

  }
)



app.post('/api/user', express.json(), async (req, res) => {
  const name = req.body.name;
  if (!name) {
    res.status(400).send('Bad Request');
    return;
  }
  await db.collection('user').insertOne({ name: name });
  res.status(200).send('Created');
});


const upload = multer({ dest: 'uploads/' })

app.post('/api/file',  upload.single('input-file'), async (req, res) => {
  const file_data = req.file;
  const path_data = file_data.path;
    const data = await fs.readFile(path_data, 'utf-8');
        const data_split = data.toString().split('\n');
        for(const text of data_split){
          await db.collection('user').insertOne({ name: text });
        }
        res.redirect('http://localhost:3000/');
})


  // ポート: 3000でサーバーを起動
  app.listen(3000, () => {
    // サーバー起動後に呼び出されるCallback
    console.log('start listening');
  });

}

main()