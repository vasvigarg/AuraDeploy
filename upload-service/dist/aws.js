"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const fs_1 = __importDefault(require("fs"));
const s3Client = new client_s3_1.S3Client({
    region: "auto",
    endpoint: "https://a5a0040c5bca269c0e703f855af0ee8f.r2.cloudflarestorage.com",
    credentials: {
        accessKeyId: "d1fa9ede7ec0c452989b3d8250ae3356",
        secretAccessKey: "84a5226dc2fd3ed9f01d7fb1f0e8c929392407fd826f77bd1c52ed6a022293f0",
    },
});
const uploadFile = (fileName, localFilePath) => __awaiter(void 0, void 0, void 0, function* () {
    const fileContent = fs_1.default.readFileSync(localFilePath);
    const command = new client_s3_1.PutObjectCommand({
        Bucket: "aura-deploy",
        Key: fileName,
        Body: fileContent,
    });
    const response = yield s3Client.send(command);
    console.log(response);
});
exports.uploadFile = uploadFile;
