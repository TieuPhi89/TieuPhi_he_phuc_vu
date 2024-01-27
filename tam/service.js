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
//const sendMail = require("./libs/sendMail");
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
            }   else if (url == "/sendMail") {
                req.on("end", () => {                    
                    let result = {
                        noi_dung: true
                    }
                    let from="admin@shop289.com"
                    let to="tieuphi19051989@gmail.com"
                    let subject="Contact";
                    let body="<h4>Kính chào Quý Khách, Shop Điện Thoại PET-289"
                        body+="<h4>Báo giá Iphone 17 PRO</h4>"
                        body+="<h4>Theo yêu cầu từ Khách hàng: Nguyễn Trung Hiếu</h4>"
                        body+="<h4>Giá: 50,000,000VND (50 Triệu Đồng)</h4>"
                        body+="<h4>Xin chân thành cảm ơn</h4>"
                        body+="<h4>Bộ phận Chăm Sóc Khách Hàng - Nhân Viên: Tố Như</h4>"
                    sendMail.Goi_Thu_Lien_he(from, to, subject, body).then((kq)=>{
                        console.log(kq);
                        res.end(JSON.stringify(result));
                    }).catch((err)=>{
                        console.log(err);
                        result.noi_dung=false;
                        res.end(JSON.stringify(result));
                    })
                    
                })
            } else if (url == "/SignUp") {
                req.on("end", () => {
                    let userSignUp = JSON.parse(noi_dung_nhan);
                    let strJSON = fs.readFileSync("./data/user.json", "utf8");
                    let lst = JSON.parse(strJSON);
                    lst.push(userSignUp);
                    fs.writeFileSync("./data/user.json", JSON.stringify(lst), "utf8");
                    let result = {
                        noi_dung: true
                    }
                    res.end(JSON.stringify(result));
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


