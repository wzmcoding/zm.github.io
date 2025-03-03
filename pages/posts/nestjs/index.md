---
title: 大文件分片上传
date: 2025-02-21
updated: 2025-02-21
categories: nestjs
tags:
  - nestjs
top: 1
---

### 大文件上传介绍
- 把大文件分成小文件，然后并行上传

### **如何拆分和合并**
- 通过 Blob的slice方法 对 File 分片,File是一种特殊的Blob
- 合并：fs的createWriteStream方法支持指定 start,把每个分片按照不同位置写入文件。

### Nestjs实现

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script src="https://unpkg.com/axios@0.24.0/dist/axios.min.js"></script>
</head>
<body>
    <input id="fileInput" type="file"/>
    <script>
        const fileInput = document.querySelector('#fileInput');

        const chunkSize = 20 * 1024;

        fileInput.onchange =  async function () {

            const file = fileInput.files[0];

            console.log(file);

            const chunks = [];
            let startPos = 0;
            while(startPos < file.size) {
                chunks.push(file.slice(startPos, startPos + chunkSize));
                startPos += chunkSize;
            }
            const randomStr = Math.random().toString().slice(2, 8);

            chunks.map((chunk, index) => {
                const data = new FormData();
                data.set('name', randomStr + '_' + file.name + '-' + index)
                data.append('files', chunk);
                axios.post('http://localhost:3006/upload', data);
            })
        
        }

    </script>
</body>
</html>
```

对拿到的文件进行分片，然后单独上传每个分片，分片名字为文件名 + index。
每 20k 一个分片，然后把它们移动到单独的目录：


```typescript
import { Body, Controller, Get, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 20, {
    dest: 'uploads'
  }))
  uploadFiles(@UploadedFiles() files: Array<Express.Multer.File>, @Body() body) {
    console.log('body', body);
    console.log('files', files);
    const fileName = body.name.match(/(.+)\-\d+$/)[1];
    const chunkDir = 'uploads/chunks_'+ fileName;
  
    if(!fs.existsSync(chunkDir)){
      fs.mkdirSync(chunkDir);
    }
    fs.cpSync(files[0].path, chunkDir + '/' + body.name); // 移动到指定目录
    fs.rmSync(files[0].path); // 删除临时文件
  }
}
```

在全部分片上传完之后，发送合并分片的请求
```typescript
  @Get('merge')
  merge(@Query('name') name: string) {
    const chunkDir = 'uploads/chunks_' + name;

    const files = fs.readdirSync(chunkDir);

    let startPos = 0;
    let count = 0;
    files.map(file => {
      const filePath = chunkDir + '/' + file;
      const stream = fs.createReadStream(filePath);
      stream.pipe(fs.createWriteStream('uploads/' + name, {
        start: startPos
      })).on('finish', () => {
        count++;

        if (count === files.length) {
          fs.rm(chunkDir, {
            recursive: true
          }, () => { });
        }
      })

      startPos += fs.statSync(filePath).size;
    })
  }
```

当分片全部上传完之后，前端调用 merge 接口：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script src="https://unpkg.com/axios@0.24.0/dist/axios.min.js"></script>
</head>
<body>
    <input id="fileInput" type="file"/>
    <script>
        const fileInput = document.querySelector('#fileInput');

        const chunkSize = 20 * 1024;

        fileInput.onchange =  async function () {

            const file = fileInput.files[0];

            console.log(file);

            const chunks = [];
            let startPos = 0;
            while(startPos < file.size) {
                chunks.push(file.slice(startPos, startPos + chunkSize));
                startPos += chunkSize;
            }
            const randomStr = Math.random().toString().slice(2, 8);
            const tasks = []
            chunks.map((chunk, index) => {
                const data = new FormData();
                data.set('name', randomStr + '_' + file.name + '-' + index)
                data.append('files', chunk);
                tasks.push(axios.post('http://localhost:3006/upload', data));
            })
            await Promise.all(tasks);
            axios.get('http://localhost:3006/merge?name=' + randomStr + '_' + file.name);
        }

    </script>
</body>
</html>
```

## 总结

当文件比较大的时候，文件上传会很慢，这时候一般我们会通过分片的方式来优化。

原理就是浏览器里通过 slice 来把文件分成多个分片，并发上传。

服务端把这些分片文件保存在一个目录下。

当所有分片传输完成时，发送一个合并请求，服务端通过 fs.createWriteStream 指定 start 位置，来把这些分片文件写入到同一个文件里，完成合并。

这样就实现了大文件分片上传。
