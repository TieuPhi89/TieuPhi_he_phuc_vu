// Tham chiếu tập tin biến môi trường .env
require("dotenv").config();
// Khai báo thư viện http của NODE
const http = require("http");
// Khai báo cổng dịch vụ
const port = process.env.PORT;
// Khai báo thư viện xử lý tập tin, thư mục của NODE
const fs = require("fs");
// Thư viện CRUD Mongo
const db = require("./libs/mongoDB");
// Thư viện Send Mail (Google Mail)
const sendMail = require("./libs/sendMail");


const server = http.createServer((req, res) => {
    let method = req.method;
    let url = req.url
    let kq = `Server NodeJS - Method:${method} - Url:${url}`;
    // Cấp quyền
    res.setHeader("Access-Control-Allow-Origin", '*');
    res.setHeader("Access-Control-Allow-Methods", 'PUT, POST, OPTIONS,DELETE');
    res.setHeader("Access-Control-Allow-Credentials", true);
    // Lấy dữ liệu gởi từ client -> server: POST, PUT, DELETE
    let noi_dung_nhan = ``;
    req.on("data", (data) => {
        noi_dung_nhan += data;
    })

    switch (method) {
        case "GET":
            if (url.match("\.png$")) {
                let imagePath = `./images/${url}`;
                if (!fs.existsSync(imagePath)) {
                    imagePath = `./images/noImage.png`;
                }
                let fileStream = fs.createReadStream(imagePath);
                res.writeHead(200, { "Content-Type": "image/png" });
                fileStream.pipe(res);
                return;
            } else {
                let tmp = url.substring(1).split("/");
                let collectionName = db.collectionNames[tmp[0]];
                if (collectionName != undefined) {
                    db.getAll(collectionName).then((result) => {
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(result));
                    })
                } else {
                    res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                    res.end(JSON.stringify(kq));
                }

            }
            break;
        case "POST":
            if (url == "/Login") {
                req.on("end", () => {
                    let ket_qua = {
                        "Noi_dung": true
                    }
                    let user = JSON.parse(noi_dung_nhan);
                    let filter = {
                        $and: [
                            { "Ten_Dang_nhap": user.Ten_Dang_nhap },
                            { "Mat_khau": user.Mat_khau }
                        ]
                    }
                    db.getOne("user", filter).then(result => {
                        console.log(result)
                        ket_qua.Noi_dung = {
                            "Ho_ten": result.Ho_ten,
                            "Nhom": {
                                "Ma_so": result.Nhom_Nguoi_dung.Ma_so,
                                "Ten": result.Nhom_Nguoi_dung.Ten
                            }
                        };
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua));

                    }).catch(err => {
                        console.log(err);
                        ket_qua.Noi_dung = false;
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua));
                    })
                })
            } else if (url == "/SendMail") {
                req.on("end", () => {
                    let info=JSON.parse(noi_dung_nhan)
                    
                    let result = {
                        noi_dung: true
                    }
                    let from="admin@shop289.com";
                    let to="tieuphi19051989@gmail.com";
                    let subject=info.tieude;
                    let body=info.noidung;
                    
                    sendMail.Goi_Thu_Lien_he(from,to,subject,body).then((kq)=>{
                        console.log(kq);
                        res.end(JSON.stringify(result));
                    }).catch((err)=>{
                        console.log(err);
                        result.noi_dung=false;
                        res.end(JSON.stringify(result));
                    })
                })
            } else if (url == "/Dathang") {
                req.on("end", () => {
                    let dsDathang = JSON.parse(noi_dung_nhan);
                    let ket_qua = { "Noi_dung": [] };
                    dsDathang.forEach((item)=>{
                        let filter = {
                            "Ma_so": item.key
                        }
                        let collectionName= (item.nhom==1)?"tivi":(item.nhom==2)?"mobile":"food";
                        db.getOne(collectionName,filter).then(result=>{
                            item.dathang.So_Phieu_Dat = result.Danh_sach_Phieu_Dat.length + 1;
                            result.Danh_sach_Phieu_Dat.push(item.dathang);
                            // Update
                            let capnhat = {
                                $set: { Danh_sach_Phieu_Dat: result.Danh_sach_Phieu_Dat }
                            }
                            let obj = {
                                "Ma_so": result.Ma_so,
                                "Update": true
                            }
                            db.updateOne(collectionName,filter,capnhat).then((result)=>{
                                if (result.modifiedCount == 0) {
                                    obj.Update = false

                                }
                                ket_qua.Noi_dung.push(obj);
                                console.log(ket_qua.Noi_dung)
                                if (ket_qua.Noi_dung.length == dsDathang.length) {
                                    res.end(JSON.stringify(ket_qua));
                                }
                            }).catch((err)=>{
                                console.log(err);
                            })
                        }).catch((err)=>{
                            console.log(err);
                        })
                    })

                })
            }else if (url == "/ThemDienthoai") {
                req.on('end', function () {
                    let mobile = JSON.parse(noi_dung_nhan);
                    let ket_qua = { "Noi_dung": true };
                    db.insertOne("mobile", mobile).then(result => {
                        console.log(result);
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua));
                    }).catch(err => {
                        console.log(err);
                        ket_qua.Noi_dung = false;
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua));
                    })
                })
            }else if (url == "/ImagesDienthoai") {
                req.on('end', function () {
                    let img = JSON.parse(noi_dung_nhan);
                    let Ket_qua = { "Noi_dung": true };
                    // upload img in images Server ------------------------------
                    
                    let kq = saveMedia(img.name, img.src)
                    if (kq == "OK") {
                        res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                        res.end(JSON.stringify(Ket_qua));
                    }else{
                        Ket_qua.Noi_dung=false
                        res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                        res.end(JSON.stringify(Ket_qua));
                    }

                    // upload img host cloudinary ------------------------------
                    /*
                    imgCloud.UPLOAD_CLOUDINARY(img.name,img.src).then(result=>{
                        console.log(result);
                        res.end(JSON.stringify(Ket_qua));

                    }).catch(err=>{
                        Ket_qua.Noi_dung=false
                        res.end(JSON.stringify(Ket_qua))
                    })
                    */
                })

            }else if (url == "/ThemTivi") {
                req.on('end', function () {
                    let tivi = JSON.parse(noi_dung_nhan);
                    let ket_qua = { "Noi_dung": true };
                    db.insertOne("tivi", tivi).then(result => {
                        console.log(result);
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua));
                    }).catch(err => {
                        console.log(err);
                        ket_qua.Noi_dung = false;
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua));
                    })
                })
            }else if (url == "/ImagesTivi") {
                req.on('end', function () {
                    let img = JSON.parse(noi_dung_nhan);
                    let Ket_qua = { "Noi_dung": true };
                    // upload img in images Server ------------------------------
                    
                    let kq = saveMedia(img.name, img.src)
                    if (kq == "OK") {
                        res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                        res.end(JSON.stringify(Ket_qua));
                    }else{
                        Ket_qua.Noi_dung=false
                        res.writeHead(200, { "Content-Type": "text/json; charset=utf-8" });
                        res.end(JSON.stringify(Ket_qua));
                    }

                    // upload img host cloudinary ------------------------------
                    /*
                    imgCloud.UPLOAD_CLOUDINARY(img.name,img.src).then(result=>{
                        console.log(result);
                        res.end(JSON.stringify(Ket_qua));

                    }).catch(err=>{
                        Ket_qua.Noi_dung=false
                        res.end(JSON.stringify(Ket_qua))
                    })
                    */
                })

            } else {
                res.end(kq);
            }
            break;
        case "PUT":
            if (url == "/UpdateUser") {
                req.on("end", () => {
                    let userUpdate = JSON.parse(noi_dung_nhan);
                    let strJSON = fs.readFileSync("./data/user.json", "utf8");
                    let lst = JSON.parse(strJSON);
                    let vt = lst.findIndex(item => item.Ten_Dang_nhap == userUpdate.Ten_Dang_nhap && item.Mat_khau == userUpdate.Mat_khau);
                    let result = {
                        noi_dung: true
                    }
                    if (vt != -1) {
                        lst[vt].Mat_khau = userUpdate.Mat_khau_Moi
                        fs.writeFileSync("./data/user.json", JSON.stringify(lst), "utf8");
                    } else {
                        result.noi_dung = false;
                    }

                    res.end(JSON.stringify(result));

                })
            }else if (url == "/SuaDienthoai") {
                req.on('end', function () {
                    let mobile = JSON.parse(noi_dung_nhan);
                    let ket_qua = { "Noi_dung": true };
                    db.updateOne("mobile",mobile.condition,mobile.update).then(result=>{
                        console.log(result);
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua));
                    }).catch(err=>{
                        console.log(err);
                        ket_qua.Noi_dung = false;
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua)) 
                    })
                })
            }
            break;
        case "DELETE":
            if (url == "/DeleteUser") {
                let userDelete = JSON.parse(noi_dung_nhan);
                let strJSON = fs.readFileSync("./data/user.json", "utf8");
                let lst = JSON.parse(strJSON);
                let vt = lst.findIndex(item => item.Ma_so == userDelete.Ma_so);
                let result = {
                    noi_dung: true
                }
                if (vt != -1) {
                    lst.splice(vt, 1);
                    fs.writeFileSync("./data/user.json", JSON.stringify(lst), "utf8");
                } else {
                    result.noi_dung = false;
                }

                res.end(JSON.stringify(result));
            }else if (url == "/XoaDienthoai") {
                req.on('end', function () {
                    let mobile = JSON.parse(noi_dung_nhan);
                    let ket_qua = { "Noi_dung": true };
                    db.deleteOne("mobile",mobile).then(result=>{
                        console.log(result);
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua));
                    }).catch(err=>{
                        console.log(err);
                        ket_qua.Noi_dung = false;
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua))
                    })
                    
                })

            }else if (url == "/SuaTivi") {
                req.on('end', function () {
                    let tivi = JSON.parse(noi_dung_nhan);
                    let ket_qua = { "Noi_dung": true };
                    db.updateOne("tivi",tivi.condition,tivi.update).then(result=>{
                        console.log(result);
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua));
                    }).catch(err=>{
                        console.log(err);
                        ket_qua.Noi_dung = false;
                        res.writeHead(200, { "Content-Type": "text/json;charset=utf-8" });
                        res.end(JSON.stringify(ket_qua)) 
                    })
                })
            }
            break;
        default:
            res.end(kq);
            break;
    }


});

server.listen(port, () => {
    console.log(`Service run http://localhost:${port}`)
})

// Upload Media -----------------------------------------------------------------
function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};

    if (matches.length !== 3) {
        return new Error('Error ...');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
}

function saveMedia(Ten, Chuoi_nhi_phan) {
    var Kq = "OK"
    try {
        var Nhi_phan = decodeBase64Image(Chuoi_nhi_phan);
        var Duong_dan = "images//" + Ten
        fs.writeFileSync(Duong_dan, Nhi_phan.data);
    } catch (Loi) {
        Kq = Loi.toString()
    }
    return Kq
}
